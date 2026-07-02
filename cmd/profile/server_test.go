package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// startTestServer spins up an httptest.Server backed by newServer() and
// registers cleanup. Each subtest gets its own server instance.
func startTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	ts := httptest.NewServer(newServer())
	t.Cleanup(ts.Close)
	return ts
}

// getBody issues a GET against the test server and returns the response and
// body bytes. The caller is responsible for asserting on either.
func getBody(t *testing.T, ts *httptest.Server, path string) (*http.Response, []byte) {
	t.Helper()
	resp, err := http.Get(ts.URL + path)
	if err != nil {
		t.Fatalf("GET %s: %v", path, err)
	}
	t.Cleanup(func() { _ = resp.Body.Close() })
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body for %s: %v", path, err)
	}
	return resp, body
}

func TestServesIndex(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, body := getBody(t, ts, "/")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
	if !strings.Contains(string(body), "<title>test</title>") {
		t.Fatalf("body missing <title>test</title>; got %q", string(body))
	}
}

func TestImmutableAssetCacheHeader(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, _ := getBody(t, ts, "/assets/app-abc123.js")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
	want := "public, max-age=31536000, immutable"
	if got := resp.Header.Get("Cache-Control"); got != want {
		t.Fatalf("Cache-Control: got %q, want %q", got, want)
	}
}

func TestShortCacheForNonAsset(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, _ := getBody(t, ts, "/index.html")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
	want := "public, max-age=300"
	if got := resp.Header.Get("Cache-Control"); got != want {
		t.Fatalf("Cache-Control: got %q, want %q", got, want)
	}
}

func TestNotFound(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, _ := getBody(t, ts, "/does-not-exist")
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusNotFound)
	}
}

func TestETagPresent(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, _ := getBody(t, ts, "/assets/app-abc123.js")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
	etag := resp.Header.Get("ETag")
	if etag == "" {
		t.Fatal("ETag header missing")
	}
	if !strings.HasPrefix(etag, `"`) || !strings.HasSuffix(etag, `"`) {
		t.Fatalf("ETag not quoted: got %q", etag)
	}
}

func TestETagRootMatchesIndex(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	rootResp, _ := getBody(t, ts, "/")
	indexResp, _ := getBody(t, ts, "/index.html")

	rootETag := rootResp.Header.Get("ETag")
	indexETag := indexResp.Header.Get("ETag")
	if rootETag == "" || indexETag == "" {
		t.Fatalf("ETag missing: root=%q index=%q", rootETag, indexETag)
	}
	if rootETag != indexETag {
		t.Fatalf("ETag mismatch: / got %q, /index.html got %q", rootETag, indexETag)
	}
}

func TestETagConditionalRequestReturns304(t *testing.T) {
	t.Parallel()
	ts := startTestServer(t)

	resp, _ := getBody(t, ts, "/assets/app-abc123.js")
	etag := resp.Header.Get("ETag")
	if etag == "" {
		t.Fatal("ETag header missing on initial request")
	}

	req, err := http.NewRequest(http.MethodGet, ts.URL+"/assets/app-abc123.js", nil)
	if err != nil {
		t.Fatalf("build request: %v", err)
	}
	req.Header.Set("If-None-Match", etag)

	conditional, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("conditional GET: %v", err)
	}
	defer func() { _ = conditional.Body.Close() }()

	if conditional.StatusCode != http.StatusNotModified {
		t.Fatalf("status: got %d, want %d", conditional.StatusCode, http.StatusNotModified)
	}
	body, err := io.ReadAll(conditional.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	if len(body) != 0 {
		t.Fatalf("expected empty body for 304, got %d bytes", len(body))
	}
}
