[![CI](https://git.c3c.cz/lukas-cech/profile/actions/workflows/build.yaml/badge.svg?branch=main)](https://git.c3c.cz/arnie/profile/actions)

# profile

Personal website for Lukáš Čech — DevOps Architect.

Single self-contained Go binary serving a Vite-built vanilla TypeScript frontend,
embedded at compile time via `//go:embed`. Built and deployed via Nix.

**Live:** [profile.c3c.cz](https://profile.c3c.cz)

## Stack

- **Backend:** Go 1.24, stdlib `net/http`
- **Frontend:** Vite, vanilla TypeScript, no framework
- **Build:** Nix flakes (`buildNpmPackage` + `buildGoModule` + `dockerTools`)
- **Deploy:** OCI image → `docker.io/docksee/profile`
