package main

import (
	"embed"
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

	fileServer := http.FileServer(http.FS(sub))
	return cacheControl(fileServer)
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
