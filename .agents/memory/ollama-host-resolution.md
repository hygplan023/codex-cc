---
name: Containerized backend reaching Ollama / host services
description: Why server-side fetches to localhost:11434 fail when the app runs in a container, and the host-resolution pattern used to fix it.
---

# Backend-in-container cannot reach Ollama via localhost

When the api-server itself runs inside a Docker container, any server-side
`fetch("http://localhost:11434/...")` hits the *app's own container*, not the
host or the separately-running Ollama container — so Ollama detection/连接测试
fails even though the user's browser reaches `localhost:11434` fine.

**Rule:** server-side probes to local AI services must use a *container-reachable*
host, not `localhost`. User-facing config URLs (the snippets users paste into
Codex/Claude/Continue, which run on the host) must STAY `localhost`.

**How to apply:** `artifacts/api-server/src/lib/docker.ts` exports
`ollamaHost` (resolves: `OLLAMA_HOST` env > `/.dockerenv` present →
`host.docker.internal` > `localhost`), plus `ollamaApiUrl(port)` and
`toServerReachableOllamaUrl(url)` (rewrites localhost/127.0.0.1 → ollamaHost).
All server-side probes in ollama.ts / services.ts / download.ts go through these.
`docker-compose.yml` sets `OLLAMA_HOST=host.docker.internal` (hostname only — no
scheme/port) + `extra_hosts: host.docker.internal:host-gateway` (needed on Linux;
harmless on Docker Desktop). Ollama runs as a separate container publishing
11434 to the host; app reaches it via the host's published port through
host.docker.internal.

**Why:** `localhost` is per-container. Docker Desktop (Win/Mac) auto-resolves
host.docker.internal; Linux needs the host-gateway extra_hosts mapping.
