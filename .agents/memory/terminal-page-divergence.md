---
name: Terminal-themed containers page divergence
description: The containers page intentionally uses a self-contained terminal aesthetic that diverges from the rest of the app's shadcn theme.
---

The 容器管理 (containers) page (`artifacts/docker-manager/src/pages/containers.tsx`) was graduated from an approved canvas mockup ("终端硬核 · Terminal") and intentionally uses a self-contained terminal aesthetic — inline `PALETTE` constants (near-black `#05070a` bg, green `#3ef07a` accent), JetBrains Mono, window-chrome bar, `$` prompt header with blinking cursor, scanline background, grid-based terminal table, and inline-styled `IconBtn`/`ToolbarBtn` helpers.

**Why:** This diverges from the rest of the app, which uses the shadcn/Tailwind-token dark-blue/cyan theme (Card/Badge/Table components, CSS variables like `bg-card`, `text-muted-foreground`). The divergence is deliberate (approved design), not an inconsistency to "fix".

**How to apply:** If asked to restyle other pages or unify the theme, do NOT assume the containers page is a mistake. Either extend the terminal aesthetic to other pages on request, or leave containers as the intentional exception. The page keeps inline styles rather than Tailwind tokens to preserve mockup fidelity; the functional modals (create/delete/logs) were re-themed to the same palette but remain shadcn components.
