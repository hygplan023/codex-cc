---
name: Rename boundary (brand vs internal artifact id)
description: Which identifiers to rename during a rebrand and which to deliberately leave alone in this Replit artifact monorepo.
---

# Rebrand boundary: user-visible vs internal artifact identifiers

When rebranding this project (done: "Docker 管理中心" → "Codex 管理中心", GitHub repo
`docker-manager` → `codex-manager`), rename ONLY user-visible identifiers and
deliberately KEEP the internal artifact directory + workspace package name.

**Renamed (user-visible, safe):**
- GitHub repo name (PATCH /repos/{owner}/{repo}; GitHub auto-redirects old URLs so old download links keep working)
- docker-compose service key / image / container_name
- download.ts Content-Disposition filename
- install page URLs, git clone URL, `cd <dir>`, button/toast text
- README download URL
- launcher `.bat`/`.sh` window titles (ASCII "Codex Manager" — Chinese renders poorly in some Windows consoles)

**Kept unchanged on purpose:**
- workspace package name `@workspace/docker-manager`
- physical directory `artifacts/docker-manager/`
- every `pnpm --filter @workspace/docker-manager ...` command, `PUBLIC_DIR=/app/artifacts/docker-manager/dist/public`, Dockerfile build path

**Why:** renaming the artifact directory/package would change the registered artifact
id (`artifacts/docker-manager`), the workflow name (`artifacts/docker-manager: web`),
PUBLIC_DIR/Dockerfile paths, AND the canvas iframe shape ref `artifact:v3:artifacts/docker-manager`
the user is actively viewing — high risk, zero user-facing benefit (end users never see the
internal package name).

**How to apply:** displayed clone instructions must stay coherent — after the repo rename
the clone dir is `codex-manager` but the package inside is still `@workspace/docker-manager`,
so `cd codex-manager` then `pnpm --filter @workspace/docker-manager ...` is correct, NOT a bug.
Only do the deeper artifact/dir rename as a separate, coordinated migration via the artifacts skill.
