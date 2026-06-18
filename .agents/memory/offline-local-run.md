---
name: Offline package for local run
description: What it takes to make this Replit/proxy-built Docker-manager app run offline on a user's Windows/macOS machine.
---

# Running this app outside Replit (offline package)

The app is built to run inside Replit's environment: a shared reverse proxy routes
`/api`, and workflows inject `PORT` / `BASE_PATH`. When a user downloads the source
zip and runs it on their own machine, none of that exists, so several things must be
in place or startup fails (the user reported `start-windows.bat` 闪退 / crash-on-launch).

Required for a working offline run:

- **Cross-platform dev scripts.** The api-server `dev` script must NOT use shell-isms
  like `export NODE_ENV=...` — that fails on Windows `cmd`. Use plain `pnpm run build && pnpm run start`.
- **Env vars set by the launcher.** `index.ts` (server) and `vite.config.ts` (frontend)
  THROW if `PORT` / `BASE_PATH` are unset. The start scripts must explicitly set
  `PORT`, `BASE_PATH=/`, and `API_PROXY_TARGET` per process before launching.
- **Vite `/api` proxy.** Locally there is no Replit shared proxy, so vite dev server
  needs `server.proxy['/api'] -> API_PROXY_TARGET || http://localhost:8080`.
- **Scripts must `cd` to their own dir.** bat: `cd /d "%~dp0"`; sh: `cd "$(dirname "$0")"`.
  Otherwise `pnpm --filter` can't find the workspace root when launched from elsewhere
  (e.g. double-click).
- **The download packager** (`artifacts/api-server/src/routes/download.ts`) hand-rolls a
  ZIP. Two non-obvious requirements:
  - Locate the workspace root by walking up to `pnpm-workspace.yaml` — do NOT use a
    fixed `../../../../` relative hop (it resolved to `/home/runner` and packed ~91MB of
    `.npm`/`.cache` junk and nested the project under `workspace/`). Also keep a SKIP_DIRS
    list (`node_modules`, `.git`, `.cache`, `.npm`, `.agents`, `attached_assets`, `tmp`, etc.).
  - **Preserve Unix permissions** so `.sh` scripts are executable after extraction on
    macOS/Linux. In the central-directory record set version-made-by host byte to 3 (Unix)
    and external-file-attributes high 16 bits to the st_mode (`0o100755` for `*.sh`,
    `0o100644` otherwise). Without this, `./start-mac.sh` has no +x bit and fails.

- **Windows `.bat` MUST be ASCII + CRLF, no BOM.** A `.bat` authored on Linux gets LF
  line endings; cmd.exe then mis-parses every line as a command ("不是内部或外部命令").
  UTF-8 Chinese in the file also gets garbled under the default GBK/936 codepage. Fix:
  keep launcher text English/ASCII and write CRLF. The packager (`download.ts`) now force-
  normalizes any `*.bat` to CRLF at zip time so this can't regress from a Linux edit.
  (`*.sh` stays LF — correct for Unix.)

- **`.bat` error checks: use `if errorlevel 1`, never `if %ERRORLEVEL% NEQ 0`.** The
  `%ERRORLEVEL%` form combined with `cmd1 2>nul || cmd2` chaining gave a FALSE "install
  failed" even though `pnpm install` exited 0. `if errorlevel 1` (tests exit code >= 1)
  is the reliable canonical form. Run `pnpm install --frozen-lockfile` then fall back to
  a plain `pnpm install`, checking `if errorlevel 1` after each — don't `||`-chain.
- **pnpm "Ignored build scripts" warning is harmless here.** pnpm 10 ignores build
  scripts for ssh2 / cpu-features / @grpc (Dockerode optional deps we already stub) and
  esbuild (uses platform-binary optionalDependencies, no build script needed). It exits 0;
  do not treat it as a failure.
- **Strip the root `preinstall` sh-guard when packaging for distribution.** The repo's
  root `preinstall` runs `sh -c '... only-allow pnpm ...'`; `sh` is absent on many Windows
  machines (no Git Bash) so `pnpm install` aborts. The packager (`download.ts`) now
  JSON-parses the root `package.json` and deletes `scripts.preinstall` in the zip copy only
  (the Replit workspace keeps its guard). Bootstrap pnpm via `corepack enable` first,
  falling back to `npm i -g pnpm`.

**Why:** these are environment-coupling assumptions that are invisible from the code
until someone runs it off-Replit; each one independently bricks local startup.

**Pushing when the code_execution notebook is down:** it repeatedly errored with
"river ... CANCEL". Fallback that works: a `node` script run via bash that fetches the
github token from the connector REST endpoint
(`https://$REPLIT_CONNECTORS_HOSTNAME/api/v2/connection?include_secrets=true&connector_names=github`
with header `X_REPLIT_TOKEN: repl $REPL_IDENTITY`), then PUTs files via the Contents API.

**Preferred local-run path is Docker, not host Node/pnpm.** Host pnpm install on the
user's Windows kept failing in hard-to-diagnose ways. The robust answer for a Docker-mgmt
app: ship a single-container build — `docker compose up -d --build` runs `pnpm install` +
both builds INSIDE a Linux container, sidestepping all Windows Node/pnpm issues. Express
serves the built frontend (set `PUBLIC_DIR`; SPA fallback must exclude `/api` and non-GET).
The container manages the host daemon by mounting `/var/run/docker.sock` (Portainer pattern;
works on Windows Docker Desktop in Linux-container mode). **Security:** that socket = host
root and the app has no auth, so bind compose port to `127.0.0.1:18765:8080` (localhost
only), never `0.0.0.0`. Workspace libs export from `./src` directly, so no separate lib
build step is needed — bundlers read lib source.

**Distribution:** code is published to GitHub repo `hygplan023/docker-manager` (branch
`main`). The offline zip lives in-repo at `dist-package.zip`; permanent download link is
`https://github.com/hygplan023/docker-manager/raw/main/dist-package.zip`. Pushes are done
via the GitHub Contents API using the github connector token (see query-integration-data
skill) — this creates remote commits that diverge from local, which is acceptable here.
