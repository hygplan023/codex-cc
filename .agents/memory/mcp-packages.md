---
name: MCP server package reality
description: Which Model Context Protocol server packages actually exist on npm.
---

# MCP server packages — verify before referencing

Do NOT assume every `@modelcontextprotocol/server-*` name exists. Verify with `npm view <pkg>`
before putting it in user-facing config or catalogs.

Confirmed real npm packages (as of 2026-06):
- `@modelcontextprotocol/server-filesystem`
- `@modelcontextprotocol/server-memory`
- `@modelcontextprotocol/server-sequential-thinking`
- `@modelcontextprotocol/server-everything`

Notably **does not exist on npm**: `@modelcontextprotocol/server-git`. The git MCP server is
distributed as Python and run via `uvx mcp-server-git` (requires `uv`). Older guides listing
`server-git`, `server-brave-search`, or `server-sqlite` as npm installs are unreliable.
