#!/usr/bin/env bash
set -euo pipefail

REGISTRY="docker.io"
REGISTRY_USER="docksee"
REPO="${REGISTRY}/${REGISTRY_USER}/lukas-cech-profile"

if ! crane auth get docker.io > /dev/null 2>&1; then
  echo "Cannot authenticate against registry, will perform login and logout"
  read -rsp "Enter registry password ($REGISTRY/$REGISTRY_USER): " REGISTRY_PASSWORD
  trap 'crane auth logout "$REGISTRY"' EXIT

  echo "$REGISTRY_PASSWORD" | crane auth login "${REGISTRY}" -u "$REGISTRY_USER" --password-stdin
  unset REGISTRY_PASSWORD
fi

echo "Building container images..."
AMD64_TARBALL="$(nix build --no-link --print-out-paths .#container-amd64)"
ARM64_TARBALL="$(nix build --no-link --print-out-paths .#container-arm64)"

# Version tag baked into the image by Nix (git tag, rev-<shortRev>, or
# rev-<dirtyShortRev>). Refuse to push anything else — see the version block
# in flake.nix.
VERSION="$(nix eval --raw .#container-amd64.imageTag)"

if [[ -z "$VERSION" || "$VERSION" == "no-version" || "$VERSION" == "dev" ]]; then
  echo "ERROR: refusing to push — could not derive version from flake." >&2
  echo "       Either run from a git checkout (so shortRev resolves) or tag the commit." >&2
  exit 1
fi

echo "Tarballs:"
echo "  amd64: ${AMD64_TARBALL}"
echo "  arm64: ${ARM64_TARBALL}"
echo "Version tag: ${VERSION}"

echo "Pushing -> ${REPO}:${VERSION}-amd64"
crane push "${AMD64_TARBALL}" "${REPO}:${VERSION}-amd64"

echo "Pushing -> ${REPO}:${VERSION}-arm64"
crane push "${ARM64_TARBALL}" "${REPO}:${VERSION}-arm64"

push_manifest() {
  local tag="$1"
  echo "Creating manifest -> ${REPO}:${tag}"
  crane index append \
    -t "${REPO}:${tag}" \
    -m "${REPO}:${VERSION}-amd64" \
    -m "${REPO}:${VERSION}-arm64"
}

push_manifest "${VERSION}"

# If HEAD has a git tag, also publish the manifest under that tag.
GIT_TAG="$(git tag --points-at HEAD 2>/dev/null | head -1 || true)"
if [[ -n "$GIT_TAG" ]]; then
  push_manifest "$GIT_TAG"
fi

# Emit the version so callers (CI) can chain a chart-repo bump.
echo "PUSHED_VERSION=${VERSION}"

echo "Done."
