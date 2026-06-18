import { useState } from "react";
import {
  Box,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Terminal,
  Search,
  PlusCircle,
} from "lucide-react";
import { MOCK_CONTAINERS } from "./_data";

const PALETTE = {
  bgTop: "#211a16",
  bgBottom: "#19120f",
  panel: "#2a211c",
  panelAlt: "#251d18",
  border: "#3d2f27",
  borderSoft: "#352822",
  ivory: "#f4ece0",
  cream: "#e8dccb",
  muted: "#a8927d",
  faint: "#7a6857",
  amber: "#e0a45e",
  amberDeep: "#c98a3e",
  brass: "#b8985f",
  terracotta: "#c97a52",
  olive: "#9aab6a",
  oliveDeep: "#7e9050",
};

function ActionButton({
  title,
  onClick,
  children,
  tone = "neutral",
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "olive" | "danger";
}) {
  const [hover, setHover] = useState(false);
  const tones: Record<string, { fg: string; bg: string; ring: string }> = {
    neutral: { fg: PALETTE.muted, bg: "rgba(184,152,95,0.12)", ring: "rgba(184,152,95,0.35)" },
    amber: { fg: PALETTE.amber, bg: "rgba(224,164,94,0.14)", ring: "rgba(224,164,94,0.4)" },
    olive: { fg: PALETTE.olive, bg: "rgba(154,171,106,0.14)", ring: "rgba(154,171,106,0.4)" },
    danger: { fg: PALETTE.terracotta, bg: "rgba(201,122,82,0.16)", ring: "rgba(201,122,82,0.45)" },
  };
  const t = tones[tone];
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
      style={{
        color: t.fg,
        background: hover ? t.bg : "transparent",
        boxShadow: hover ? `inset 0 0 0 1px ${t.ring}` : "inset 0 0 0 1px transparent",
        transform: hover ? "translateY(-1px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

export function WarmPro() {
  const [showStopped, setShowStopped] = useState(true);
  const [search, setSearch] = useState("");

  const containers = MOCK_CONTAINERS;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `radial-gradient(1200px 600px at 80% -10%, rgba(224,164,94,0.10), transparent 60%), linear-gradient(180deg, ${PALETTE.bgTop} 0%, ${PALETTE.bgBottom} 100%)`,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: PALETTE.cream,
      }}
    >
      <link
        rel="stylesheet"
        media="print"
        onLoad={(e) => {
          (e.currentTarget as HTMLLinkElement).media = "all";
        }}
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
      />

      <div className="mx-auto max-w-[1500px] px-12 py-10">
        {/* Header */}
        <header className="mb-9 flex items-end justify-between">
          <div className="flex items-start gap-4">
            <div
              className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(150deg, ${PALETTE.amber}, ${PALETTE.amberDeep})`,
                boxShadow: "0 8px 24px rgba(201,138,62,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Box className="h-6 w-6" style={{ color: "#2a1c0e" }} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                className="text-4xl leading-none tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 700,
                  color: PALETTE.ivory,
                }}
              >
                容器管理
              </h2>
              <p
                className="mt-2 text-[15px]"
                style={{ color: PALETTE.muted, fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
              >
                查看并管理所有的 Docker 容器实例。
              </p>
            </div>
          </div>
          <div
            className="hidden items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] md:flex"
            style={{
              color: PALETTE.brass,
              background: "rgba(184,152,95,0.08)",
              boxShadow: `inset 0 0 0 1px ${PALETTE.border}`,
            }}
          >
            Codex 管理中心
          </div>
        </header>

        {/* Panel */}
        <section
          className="overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(180deg, ${PALETTE.panel} 0%, ${PALETTE.panelAlt} 100%)`,
            boxShadow:
              "0 28px 60px -24px rgba(0,0,0,0.6), 0 2px 0 rgba(255,255,255,0.03) inset, 0 0 0 1px " +
              PALETTE.border,
          }}
        >
          {/* Toolbar */}
          <div
            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: `1px solid ${PALETTE.borderSoft}` }}
          >
            <div className="flex flex-1 flex-wrap items-center gap-5">
              <div className="relative w-full sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: PALETTE.faint }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索容器名称、镜像或 ID..."
                  className="h-11 w-full rounded-xl pl-10 pr-4 text-sm outline-none transition-colors"
                  style={{
                    background: PALETTE.bgBottom,
                    color: PALETTE.cream,
                    fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: `inset 0 0 0 1px ${PALETTE.border}`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowStopped((v) => !v)}
                className="flex items-center gap-3"
              >
                <span
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                  style={{
                    background: showStopped
                      ? `linear-gradient(90deg, ${PALETTE.amberDeep}, ${PALETTE.amber})`
                      : "#3a2c24",
                    boxShadow: showStopped
                      ? "0 2px 10px rgba(201,138,62,0.4) inset"
                      : `inset 0 0 0 1px ${PALETTE.border}`,
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 rounded-full transition-transform duration-200"
                    style={{
                      background: showStopped ? "#fff6e9" : "#bca893",
                      transform: showStopped ? "translateX(22px)" : "translateX(2px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                  />
                </span>
                <span
                  className="whitespace-nowrap text-sm"
                  style={{ color: PALETTE.cream, fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
                >
                  显示停止的容器
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <RefreshButton />
              <NewContainerButton />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  style={{
                    background: "rgba(184,152,95,0.05)",
                    borderBottom: `1px solid ${PALETTE.border}`,
                  }}
                >
                  {["名称", "状态", "镜像", "端口映射", "创建时间"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        color: PALETTE.brass,
                        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <th
                    className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      color: PALETTE.brass,
                      fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
                    }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c, idx) => {
                  const isRunning = c.state === "running";
                  return (
                    <Row key={c.id} last={idx === containers.length - 1}>
                      {/* Name */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          <span
                            className="relative flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center"
                          >
                            <span
                              className="absolute inline-flex h-full w-full rounded-full"
                              style={{
                                background: isRunning ? PALETTE.olive : PALETTE.faint,
                                boxShadow: isRunning
                                  ? `0 0 0 4px rgba(154,171,106,0.18)`
                                  : "none",
                              }}
                            />
                          </span>
                          <div>
                            <div
                              className="text-sm"
                              style={{
                                color: PALETTE.ivory,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 500,
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              className="mt-1 text-xs"
                              style={{
                                color: PALETTE.faint,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {c.id.substring(0, 12)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 align-middle">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs capitalize"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: isRunning ? "#dbe9b3" : PALETTE.muted,
                            background: isRunning
                              ? "rgba(154,171,106,0.16)"
                              : "rgba(184,152,95,0.10)",
                            boxShadow: isRunning
                              ? "inset 0 0 0 1px rgba(154,171,106,0.4)"
                              : `inset 0 0 0 1px ${PALETTE.border}`,
                          }}
                        >
                          {c.state}
                        </span>
                      </td>

                      {/* Image */}
                      <td className="px-6 py-5 align-middle">
                        <span
                          className="block max-w-[220px] truncate text-xs"
                          title={c.image}
                          style={{
                            color: PALETTE.muted,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {c.image}
                        </span>
                      </td>

                      {/* Ports */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex max-w-[240px] flex-wrap gap-1.5">
                          {c.ports.map((p, i) => (
                            <span
                              key={i}
                              className="rounded-md px-2 py-1 text-[11px]"
                              style={{
                                color: PALETTE.amber,
                                background: "rgba(224,164,94,0.10)",
                                fontFamily: "'JetBrains Mono', monospace",
                                boxShadow: "inset 0 0 0 1px rgba(224,164,94,0.22)",
                              }}
                            >
                              {p.publicPort ? `${p.publicPort}→` : ""}
                              {p.privatePort}/{p.type}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-5 align-middle">
                        <span
                          className="text-xs"
                          style={{
                            color: PALETTE.muted,
                            fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
                          }}
                        >
                          {c.createdLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton title="查看日志" tone="neutral">
                            <Terminal className="h-4 w-4" />
                          </ActionButton>
                          {isRunning ? (
                            <>
                              <ActionButton title="停止" tone="amber">
                                <Square className="h-4 w-4" />
                              </ActionButton>
                              <ActionButton title="重启" tone="olive">
                                <RefreshCw className="h-4 w-4" />
                              </ActionButton>
                            </>
                          ) : (
                            <ActionButton title="启动" tone="olive">
                              <Play className="h-4 w-4" />
                            </ActionButton>
                          )}
                          <ActionButton title="删除" tone="danger">
                            <Trash2 className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </td>
                    </Row>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: PALETTE.faint, fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
        >
          共 {containers.length} 个容器 · 实时同步自 Docker 守护进程
        </p>
      </div>
    </div>
  );
}

function Row({ children, last }: { children: React.ReactNode; last: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: last ? "none" : `1px solid ${PALETTE.borderSoft}`,
        background: hover ? "rgba(224,164,94,0.05)" : "transparent",
        transition: "background 160ms ease",
      }}
    >
      {children}
    </tr>
  );
}

function RefreshButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm transition-all duration-200"
      style={{
        color: PALETTE.cream,
        background: hover ? "rgba(184,152,95,0.14)" : "rgba(184,152,95,0.06)",
        boxShadow: `inset 0 0 0 1px ${hover ? "rgba(184,152,95,0.5)" : PALETTE.border}`,
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <RefreshCw className="h-4 w-4" style={{ color: PALETTE.brass }} />
      刷新
    </button>
  );
}

function NewContainerButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium transition-all duration-200"
      style={{
        color: "#2a1c0e",
        background: `linear-gradient(150deg, ${PALETTE.amber}, ${PALETTE.amberDeep})`,
        boxShadow: hover
          ? "0 10px 28px -8px rgba(201,138,62,0.6), inset 0 1px 0 rgba(255,255,255,0.3)"
          : "0 6px 18px -8px rgba(201,138,62,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
        transform: hover ? "translateY(-1px)" : "none",
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
      新建容器
    </button>
  );
}
