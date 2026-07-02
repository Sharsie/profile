package main

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed all:static
var staticFS embed.FS

// newServer returns an http.Handler that serves the embedded static directory
// rooted at "static/" with cache-control headers applied per path prefix.
func newServer() http.Handler {
	sub, err := fs.Sub(staticFS, "static")
	if err != nil {
		// fs.Sub only fails on a malformed path; "static" is a constant
		// and the embed directive ensures the directory exists, so this
		// is effectively unreachable. Panic so a misconfiguration is loud.
		panic("profile: fs.Sub(staticFS, \"static\"): " + err.Error())
	}

	etags, err := buildETags(sub)
	if err != nil {
		// Only fails if the embedded FS can't be walked/read, which would
		// mean the binary was built with a broken static tree.
		panic("profile: buildETags: " + err.Error())
	}

	fileServer := http.FileServer(http.FS(sub))
	return cacheControl(withETag(etags, fileServer))
}

// buildETags walks fsys and returns a map from URL path (e.g. "/assets/app.js")
// to a strong ETag derived from the file's content hash. embed.FS reports a
// zero ModTime for every file, so http.ServeContent can't do time-based
// conditional requests here; a content hash gives us that instead. "/" is
// also mapped to index.html's hash, matching how http.FileServer resolves it.
func buildETags(fsys fs.FS) (map[string]string, error) {
	etags := make(map[string]string)
	err := fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			return err
		}
		sum := sha256.Sum256(data)
		tag := `"` + hex.EncodeToString(sum[:]) + `"`
		etags["/"+path] = tag
		if path == "index.html" {
			etags["/"] = tag
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return etags, nil
}

// withETag sets the ETag response header for requests matching a known
// static file. http.FileServer's underlying http.ServeContent honors an
// already-set ETag header against If-None-Match and turns matching requests
// into a 304 Not Modified automatically.
func withETag(etags map[string]string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if tag, ok := etags[r.URL.Path]; ok {
			w.Header().Set("ETag", tag)
		}
		next.ServeHTTP(w, r)
	})
}

// cacheControl applies Cache-Control headers based on the request path.
// Hashed assets under /assets/ get a long-lived immutable cache; everything
// else gets a short-lived cache so HTML and entry files refresh quickly.
func cacheControl(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=300")
		}
		next.ServeHTTP(w, r)
	})
}
