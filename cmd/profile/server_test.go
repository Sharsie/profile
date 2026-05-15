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
