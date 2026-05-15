# profile

> **For Claude:** After finishing a task that changes how the website is
> architected, structured, or built (new components, changed conventions,
> build/CI changes) — not plain content/copy edits — ask the user: "Should I
> update CLAUDE.md?"

DevOps Architect personal website (Lukáš Čech). A single self-contained Go binary
serves a Vite-built vanilla TypeScript frontend that is embedded at compile time
via `//go:embed`. The whole project — frontend build, Go binary, and OCI container
image — is produced by a unified Nix flake and deployed by pushing the container
image to `docker.io/docksee/lukas-cech-profile` (target domain: `profile.c3c.cz`).

Deployed to Kubernetes via a sibling helm chart repo
`git.c3c.cz/lukas-cech/profile-chart` (ArgoCD auto-sync on its `main`). App CI
bumps the chart's `image.tag` after each successful push. Namespace: `lukas-cech`.

## Module

- Go module path: `go.c3c.cz/c3c/profile`
- Go version: `1.24`

## Directory Layout

```
profile/
├── CLAUDE.md                        # This file — project conventions
├── flake.nix                        # Nix: frontend build + Go build + container + push
├── flake.lock
├── go.mod                           # module go.c3c.cz/c3c/profile
├── go.sum
│
├── .gitea/
│   └── workflows/
│       └── build.yaml               # Gitea Actions: build + push, then bump chart repo
│
├── cmd/
│   └── profile/
│       ├── main.go                  # Entry point: mux (/livez, /readyz, static), graceful shutdown
│       ├── server.go                # File server setup, cache headers, embed FS
│       └── static/                  # Populated by Nix build — NOT committed
│           └── .gitkeep             # Keeps empty dir present so //go:embed compiles
│
├── web/                             # Frontend source (Vite + vanilla TS)
│   ├── package.json
│   ├── package-lock.json            # Committed; consumed by buildNpmPackage
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.ts                  # Entry point; wires components, theme toggle
│       ├── style.css                # CSS variables (light/dark), reset, layout
│       ├── theme.ts                 # Dark/light toggle + localStorage persistence
│       ├── assets/
│       │   ├── profile.jpg          # Headshot (captured from cv.c3c.cz)
│       │   └── (cv.pdf)             # NOT here — rendered by the Nix build (cvPdf derivation)
│       └── components/
│           ├── hero.ts
│           ├── about.ts
│           ├── experience.ts
│           ├── skills.ts
│           ├── projects.ts
│           └── contact.ts
│
└── scripts/
    └── push.sh                      # Multi-arch container push
```

Note: `cmd/profile/static/` is populated by the Nix build (the frontend
derivation's `dist/` output is copied in before `go build`). Only the
`.gitkeep` is committed so the directory exists for `//go:embed` to compile
during local development without a full Nix build.

## Build & Run

### Go server (local)

```sh
CGO_ENABLED=0 go run ./cmd/profile
```

- Default port `8080`; override with `PORT=...` (e.g. `PORT=9000 CGO_ENABLED=0 go run ./cmd/profile`).
- `CGO_ENABLED=0` matches the production (Nix) build mode and avoids needing
  `gcc` in jailed/minimal dev environments.
- The server embeds `cmd/profile/static/` at compile time. The directory
  contains commit-time test fixtures (a minimal `index.html` and a sample
  `assets/app-abc123.js`); the Nix build overwrites it with the Vite `dist/`
  output before compiling the binary.

### Tests

```sh
CGO_ENABLED=0 go test ./...
```

Server tests live in `cmd/profile/server_test.go` and use `httptest.NewServer`
against the test fixtures in `cmd/profile/static/`.

### Frontend dev server / production build

Dev server (default `http://localhost:5173`):

```sh
cd web && npm run dev
```

Production build (outputs to `web/dist/`):

```sh
cd web && npm run build
```

In jailed envs without `/usr/bin/env` on PATH, the npm-script shebangs fail.
Invoke the toolchain directly instead:

```sh
cd web && \
  node ./node_modules/typescript/bin/tsc -b && \
  node ./node_modules/vite/bin/vite.js build
# dev server:
cd web && node ./node_modules/vite/bin/vite.js
```

`vite.config.ts` writes to `dist/` with hashed filenames under `dist/assets/`,
which lines up with the Go server's immutable cache rule for `/assets/*`.

### Component convention

Each section lives in its own module: `web/src/components/<name>.ts`, exporting

```ts
export function render(): HTMLElement
```

`web/src/main.ts` calls `initTheme()` first, builds the header (nav + theme
toggle), then mounts the section nodes returned by each component into `#app`
via `replaceChildren`. No framework, no virtual DOM — components return real
`HTMLElement`s built with `document.createElement` (no `innerHTML`).

#### Adding a new employer/role

A given job shows up in two places that must be kept in sync by hand — there's
no shared data source:

- `web/src/components/experience.ts` — one `Entry` in the `ENTRIES` array
  (short orientation-only impact line, no metrics).
- `web/src/components/projects.ts` — one `Theme` in the `THEMES` array
  (fuller context/impact/actions for the "Notable Work" cards).

Both arrays are ordered newest-first by start date; concurrent/overlapping
roles (freelance-style, multiple "Present" end dates) are expected — don't
assume only one entry can be "Present" at a time. The job title used is
whatever the user directs, which may not match the literal HR title (e.g. a
role's actual scope can run ahead of or behind the official title) — confirm
wording with the user rather than guessing, title/scope framing is a
recurring point of discussion.

### Theme

Color tokens live on `:root` (light defaults) in `web/src/style.css`, overridden
by `:root[data-theme="dark"]`. `web/src/theme.ts` reads `localStorage`, falls
back to `prefers-color-scheme`, writes `data-theme` on `<html>`, and follows OS
preference changes only while no manual choice has been stored.

### Nix build / container build / push

The flake produces the native binary, the frontend dist, per-arch container
images, and a multi-arch push wrapper. Standard commands:

```sh
# Native binary (matches host arch). Produces ./result/bin/profile.
nix build

# Frontend dist only (handy for inspecting the Vite output).
nix build .#web

# Rendered PDF CV only (handy for inspecting the print output).
nix build .#cv     # produces ./result — the cv.pdf file

# Per-arch OCI image tarballs.
nix build .#container-amd64    # load with: docker load < result
nix build .#container-arm64

# Multi-arch push to docker.io/docksee/lukas-cech-profile.
# Builds both arch images, pushes each as <version>-<arch>, then publishes a
# multi-arch manifest under <version> (and any git tag pointing at HEAD).
# Prints `PUSHED_VERSION=<tag>` on its last line for CI to chain a chart bump.
nix run .#push

# Dev shell (go, gopls, gotools, go-tools, nodejs, npm).
nix develop
```

`<version>` is derived in `flake.nix`: `self.tag` wins, else `rev-<shortRev>`,
else `rev-<dirtyShortRev>`, else `no-version`. There is no literal `dev`
fallback — `scripts/push.sh` refuses to push `no-version`/`dev` so the registry
never gets ambiguous tags.

Always go through `nix run .#push` rather than executing
`scripts/push.sh` directly — the script depends on `crane`, `nix`, and `git`
being on PATH, and the flake's `runtimeInputs` is what guarantees that.

### CI/CD (Gitea Actions)

`.gitea/workflows/build.yaml` triggers on pushes to `main` and any tag. Runs in
the `docksee/nixos-gitea:${{ vars.NIX_IMAGE_VERSION }}` container (Nix preinstalled).

Two jobs:

**`push`**
1. Checks out with full depth (`fetch-depth: 0`) so `self.shortRev`/`self.tag` resolve correctly in the flake.
2. Authenticates crane against Docker Hub using `USER_DOCKERHUB` / `TOKEN_DOCKERHUB` secrets — `scripts/push.sh` skips its interactive login block when crane is already authenticated.
3. Runs `nix run .#push` (builds both arch images, publishes the multi-arch manifest), captures `PUSHED_VERSION=<tag>` into the job output `version`.

**`bump-chart`** (`needs: push`)
- Clones `git.c3c.cz/lukas-cech/profile-chart` as the shared `chart-service-account`, runs `yq -i '.image.tag = "<version>"' values.yaml`, commits, pushes to `main`. Retries up to 5× with rebase to survive concurrent bumps. ArgoCD then auto-syncs the new image.

Required Gitea secrets: `USER_DOCKERHUB`, `TOKEN_DOCKERHUB`, `TOKEN_GITEA_CHART_SERVICE_ACCOUNT` (provisioned org-wide). Required Gitea variable: `NIX_IMAGE_VERSION`. The `chart-service-account` service account must be a `Write` collaborator on `profile-chart`.

#### First-time setup: `npmDepsHash`

`flake.nix` ships with a placeholder `npmDepsHash` (43 `A`s + `=`) inside the
`webAssets = pkgs.buildNpmPackage { … }` block. The first `nix build` will
fail with a hash mismatch and print the real hash:

```
error: hash mismatch in fixed-output derivation '…profile-web-npm-deps.drv':
  specified: sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
       got: sha256-<real hash here>
```

Copy the `got:` value over the placeholder in `flake.nix` and re-run
`nix build`. Repeat the same flow
whenever `web/package-lock.json` changes — `buildNpmPackage` recomputes the
hash deterministically from the lockfile, so any lockfile edit invalidates
the previous value.

### PDF resume (cv.pdf)

`cv.pdf` is **generated by the Nix build** — not committed, not a manual step.
The `cvPdf` derivation in `flake.nix` renders the built site to PDF with
headless Chromium, and `srcWithStatic` splices the result into
`cmd/profile/static/assets/cv.pdf` before `go build`, so the embed picks it up.
The hero's "Download CV" CTA points to `/assets/cv.pdf` with a `download`
attribute; it resolves automatically after any `nix build`.

How the derivation works (and why):

- The site is **client-side rendered** — `index.html` loads `/src/main.ts` as an
  ES module and JS builds the DOM, so the `@media print` rules only apply after
  that JS runs. Static HTML→PDF tools (weasyprint, wkhtmltopdf) can't execute it,
  hence a real browser engine.
- ES modules can't load over `file://` (CORS), so the derivation serves the Vite
  dist over loopback HTTP (`python3 -m http.server` on `:8099`) for the render.
  The Nix sandbox permits loopback while blocking external network.
- `--no-sandbox` is required (the build is already sandboxed; Chromium's own
  sandbox lacks the privileges it needs). `--virtual-time-budget=10000` lets the
  client-side render settle before capture. `FONTCONFIG_FILE` is set to a
  generated fonts.conf (dejavu + liberation) so glyphs render instead of tofu.

Inspect the output on its own with `nix build .#cv` (produces `./result`, the
`cv.pdf` file). To change layout, edit the `@media print` block in
`web/src/style.css` — no flake change needed.

**Print stylesheet** is in `web/src/style.css` (`@media print`):
forces sections visible, expands `<details>`, drops nav/buttons, strips
shadow/transform from cards, renders links as plain text.

### Post-handoff checklist

Items blocked in the jail or deferred by design — must be completed before
the site is production-ready:

1. **`npmDepsHash`** — run `nix build`, copy the `got:` hash
   into `flake.nix`, re-run. Required once; repeat only when `package-lock.json`
   changes.
2. **Nix end-to-end** — `nix build .#container-amd64` →
   `docker load < result` → `docker run -p 8080:8080 lukas-cech-profile:<tag>` →
   smoke test `http://localhost:8080` (incl. `/livez` and `/readyz`).
3. ~~**cv.pdf**~~ — done: rendered by the `cvPdf` derivation in `flake.nix`
   during every `nix build`. No manual step.
4. **OG image** — replace `web/public/og-image.jpg` (currently
   the 1363×1363 headshot) with a proper 1200×630 share card; no HTML change
   needed.
5. **Push** — `nix run .#push` after Docker Hub credentials are active. First
   push also bumps `profile-chart` away from `image.tag: unknown`.
6. **ArgoCD** — wire the `profile-chart` Application (via `nexus/cluster-workloads`)
   only *after* the first image push, else the sync fails pulling `:unknown`.
7. **DNS** — point `profile.c3c.cz` at the cluster after the container is
   running.
