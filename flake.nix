{
  description = "DevOps Architect personal website";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Version policy: tagged build wins, otherwise rev-<shortRev>, otherwise
        # rev-<dirtyShortRev> when the worktree has uncommitted changes. We never
        # fall back to a literal "dev" — `scripts/push.sh` refuses anything that
        # looks like an unresolved version so we don't pollute the registry with
        # ambiguous tags.
        version =
          if self ? tag then self.tag
          else if self ? shortRev then "rev-${self.shortRev}"
          else if self ? dirtyShortRev then "rev-${self.dirtyShortRev}"
          else "no-version";

        # Build the Vite frontend into a static dist/ tree.
        #
        # IMPORTANT: replace `npmDepsHash` with the value reported by
        # `nix build` on first run.
        webAssets = pkgs.buildNpmPackage {
          pname = "profile-web";
          inherit version;
          src = ./web;
          npmDepsHash = "sha256-S+3uDiL8mOR+urGmSxt9ghm725B3OZuvkm16VHqhjFk=";
          npmBuildScript = "build";
          installPhase = ''
            runHook preInstall
            cp -r dist $out
            runHook postInstall
          '';
        };

        # Render the built site to a PDF CV using headless Chromium.
        #
        # The site is client-side rendered: index.html loads /src/main.ts as an
        # ES module and JavaScript builds the DOM, so the @media print rules in
        # style.css only take effect after that JS has run. Static HTML→PDF tools
        # (weasyprint, wkhtmltopdf) can't execute that JS, hence a real browser
        # engine. ES modules also can't load over file:// (CORS), so we serve the
        # Vite dist over loopback HTTP for the duration of the render — the Nix
        # sandbox permits loopback while blocking external network.
        cvPdf = pkgs.runCommand "profile-cv-pdf"
          { nativeBuildInputs = [ pkgs.chromium pkgs.python3 ]; } ''
          export HOME="$TMPDIR"
          # Fonts, else Chromium renders tofu boxes instead of glyphs.
          export FONTCONFIG_FILE=${pkgs.makeFontsConf {
            fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
          }}

          python3 -m http.server 8099 --directory ${webAssets} &
          srv=$!
          trap 'kill $srv' EXIT

          # Wait for the server to accept connections before rendering.
          for _ in $(seq 1 50); do
            python3 -c 'import socket,sys; sys.exit(0 if socket.socket().connect_ex(("127.0.0.1",8099))==0 else 1)' && break
            sleep 0.2
          done

          # --no-sandbox: the Nix build is already sandboxed and Chromium's own
          # sandbox needs privileges it lacks here. --virtual-time-budget lets
          # the client-side render settle before the page is captured.
          chromium \
            --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
            --no-pdf-header-footer \
            --virtual-time-budget=10000 \
            --run-all-compositor-stages-before-draw \
            --print-to-pdf="$out" \
            http://127.0.0.1:8099/
        '';

        # Repository source with the Vite dist output spliced into
        # cmd/profile/static/ so that `//go:embed all:static` in
        # cmd/profile/server.go picks up the real frontend assets at compile
        # time. The committed test fixtures under cmd/profile/static/ are
        # deliberately overwritten — they exist only so local `go build`
        # without Nix succeeds, and so `go test ./...` has stable inputs.
        srcWithStatic = pkgs.runCommand "profile-src" { } ''
          cp -r ${./.} $out
          chmod -R u+w $out
          rm -rf $out/cmd/profile/static
          mkdir -p $out/cmd/profile/static
          cp -r ${webAssets}/* $out/cmd/profile/static/
          # Files copied from the store are read-only, including the assets/
          # dir — make it writable so the PDF can be dropped in.
          chmod -R u+w $out/cmd/profile/static
          # Splice the rendered PDF in beside the hashed Vite assets so the
          # hero's /assets/cv.pdf download link resolves at runtime.
          cp ${cvPdf} $out/cmd/profile/static/assets/cv.pdf
        '';

        # Build the Go binary for a specific OS/architecture.
        mkBinary = { goos ? "linux", goarch }: pkgs.buildGoModule {
          pname = "profile";
          inherit version;
          src = srcWithStatic;
          vendorHash = null; # stdlib-only, no vendored deps
          subPackages = [ "cmd/profile" ];

          env.CGO_ENABLED = 0;

          preBuild = ''
            export GOOS=${goos}
            export GOARCH=${goarch}
            # Redirect Go telemetry away from $HOME so non-sandboxed builds
            # don't leak /homeless-shelter/.config/go/telemetry to the host.
            export GOTELEMETRYDIR="$TMPDIR/go-telemetry"
            export GOTELEMETRY=off
            mkdir -p "$GOTELEMETRYDIR"
          '';

          # normalize native-compiled builds with crosscompiled as per https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/go/module.nix
          postBuild = nixpkgs.lib.optionalString (pkgs.stdenv.hostPlatform == pkgs.stdenv.buildPlatform) ''
            (
              dir=$GOPATH/bin/''${GOOS}_''${GOARCH}
              if [[ -n "$(shopt -s nullglob; echo $dir/*)" ]]; then
                mv $dir/* $dir/..
              fi
              if [[ -d $dir ]]; then
                rmdir $dir
              fi
            )
          '';

          ldflags = [
            "-s" "-w"
            "-X main.version=${version}"
          ];

          # Tests rely on the committed test fixtures under cmd/profile/static/,
          # but srcWithStatic deletes those and substitutes the real Vite dist.
          # Run `go test ./...` locally instead (see CLAUDE.md). Skipping in
          # the Nix build also keeps cross-compiled binaries from trying to run.
          doCheck = false;

          meta = {
            description = "DevOps Architect personal website";
            mainProgram = "profile";
          };
        };

        # Build a minimal container image for a specific architecture.
        mkContainer = { goarch, ociArch }: pkgs.dockerTools.buildLayeredImage {
          name = "lukas-cech-profile";
          tag = version;
          architecture = ociArch;
          compressor = "none";

          contents = pkgs.buildEnv {
            name = "image-root";
            paths = [
              (mkBinary { inherit goarch; })
              pkgs.cacert
            ];
            pathsToLink = [ "/bin" "/etc/ssl" ];
          };

          config = {
            # Run as nobody:nogroup. The image carries no /etc/passwd; this is
            # a numeric UID:GID, which is what kubernetes consumes anyway.
            # Required for clusters enforcing PodSecurityAdmission restricted.
            User = "65534:65534";
            Cmd = [ "/bin/profile" ];
            Env = [
              "SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt"
              "PORT=8080"
            ];
            ExposedPorts = { "8080/tcp" = { }; };
          };
        };

        # Determine native GOARCH from Nix system string.
        nativeGoarch =
          if builtins.match "aarch64-.*" system != null then "arm64"
          else "amd64";

        # Multi-arch push wrapper — invokes scripts/push.sh under a shell with
        # nix, crane, and git on PATH (matches weather-ingest exactly). The
        # script builds both container-amd64 and container-arm64, pushes each,
        # then creates a multi-arch manifest via `crane index append`. Always
        # invoke via `nix run .#push` so runtimeInputs are present — running
        # scripts/push.sh directly is not the supported path.
        pushScript = pkgs.writeShellApplication {
          name = "profile-push";
          runtimeInputs = with pkgs; [ nix crane git ];
          text = ''
            exec "${toString ./scripts/push.sh}" "$@"
          '';
        };

        # Runs the Vite dev server (HMR) straight out of the working tree
        # instead of rebuilding the whole flake on every change. Invokes vite
        # directly rather than via `npm run dev` — npm-script shebangs assume
        # /usr/bin/env, which isn't present in jailed/minimal environments.
        # Must be run from the repo root (same convention as `nix run .#push`);
        # requires `web/node_modules` to already exist (`npm install` in web/).
        serveScript = pkgs.writeShellApplication {
          name = "profile-serve";
          runtimeInputs = with pkgs; [ nodejs ];
          text = ''
            cd web
            if [[ ! -d node_modules ]]; then
              echo "web/node_modules is missing — run 'npm install' in web/ first." >&2
              exit 1
            fi
            exec node ./node_modules/vite/bin/vite.js "$@"
          '';
        };

      in
      {
        packages = {
          # Native binary (matches host arch).
          default = mkBinary { goarch = nativeGoarch; };

          # Frontend dist (handy for inspecting the built Vite output).
          web = webAssets;

          # Rendered PDF CV (handy for inspecting the print output).
          cv = cvPdf;

          # Per-architecture container images.
          container-amd64 = mkContainer { goarch = "amd64"; ociArch = "amd64"; };
          container-arm64 = mkContainer { goarch = "arm64"; ociArch = "arm64"; };

          push = pushScript;
          serve = serveScript;
        };

        apps.push = {
          type = "app";
          program = "${pushScript}/bin/profile-push";
        };

        apps.serve = {
          type = "app";
          program = "${serveScript}/bin/profile-serve";
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go
            gopls
            gotools
            go-tools
            nodejs
            nodePackages.npm
          ];
        };
      }
    );
}
