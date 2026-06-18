---
name: Codex CLI config format
description: How modern OpenAI Codex CLI is configured to use a local Ollama backend.
---

# Codex CLI config (modern)

Modern Codex CLI reads `~/.codex/config.toml` (TOML, NOT the old `config.yaml`). Older
docs showing `provider:`, `baseURL:`, `approvalMode:`, or a `tools:` list are outdated.

Working shape for local Ollama:

```toml
model = "qwen2.5-coder:7b"
model_provider = "ollama-local"

[model_providers.ollama-local]
name = "Ollama (本地)"
base_url = "http://localhost:11434/v1"
wire_api = "responses"
```

**Provider id must NOT be `ollama`.** Codex CLI ~0.141 ships a built-in `ollama` provider
and rejects any custom `[model_providers.ollama]` at startup with
`model_providers contains reserved built-in provider IDs: ollama. Built-in providers cannot be overridden.`
Use a distinct id like `ollama-local` (and match `model_provider`) so a custom `base_url`
can still be set. **Why:** verified empirically with `codex exec`.

**`wire_api` MUST be `"responses"` (NOT `"chat"`).** As of Codex CLI ~0.141 / Feb 2026,
Chat Completions support was REMOVED: a config with `wire_api = "chat"` fails at startup
with `` `wire_api = "chat"` is no longer supported `` (see github.com/openai/codex/discussions/7782).
`"responses"` is the only accepted value (and the default if omitted).
**Why:** verified empirically — `codex exec` rejects `chat` on load. Earlier guidance that
"Ollama only speaks Chat Completions so wire_api must be chat" is now WRONG.

**Ollama version floor:** the Responses API endpoint `/v1/responses` only exists in
**Ollama ≥ 0.13.3** (experimental, non-stateful). Older Ollama returns HTTP 404, so users
must upgrade Ollama for local Codex to work at all.

MCP tools go under `[mcp_servers.NAME]` (underscore in the section prefix):

```toml
[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "."]
```

**Windows:** wrap `npx`/`uvx` with `cmd /c` so the launcher resolves:
`command = "cmd"`, `args = ["/c", "npx", "-y", "<pkg>", ...]`.

Launch (bypasses the flaky Windows sandbox/approvals): `codex --dangerously-bypass-approvals-and-sandbox`.
