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
  bg: "#f4f1ea",
  panel: "#fbfaf6",
  panelAlt: "#f7f5ee",
  ink: "#3a3f3a",
  inkSoft: "#6b7169",
  inkFaint: "#9aa097",
  hairline: "#e6e2d7",
  hairlineSoft: "#eee9dd",
  sage: "#7d9a7e",
  sageBg: "#e8efe6",
  sageInk: "#4f6b51",
  slate: "#8a9099",
  slateBg: "#ecedea",
  dusty: "#7e94a6",
  dustyBg: "#e9eef1",
  dustyInk: "#52677a",
  rose: "#b18b86",
  roseInk: "#9a6a64",
};

const SANS =
  "'Noto Sans SC', 'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace";

function IconButton({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
}) {
  const isDanger = tone === "danger";
  return (
    <button
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
      style={{
        color: isDanger ? PALETTE.roseInk : PALETTE.inkSoft,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDanger
          ? "#f1e4e2"
          : "#efece2";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

export function CalmLight() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: PALETTE.bg,
        fontFamily: SANS,
        color: PALETTE.ink,
      }}
    >
      <div className="mx-auto max-w-[1400px] px-12 py-12">
        {/* Header */}
        <header className="mb-10 flex items-start gap-4">
          <div
            className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: PALETTE.sageBg,
              color: PALETTE.sageInk,
            }}
          >
            <Box className="h-6 w-6" strokeWidth={1.6} />
          </div>
          <div>
            <h2
              className="text-3xl font-medium"
              style={{ color: PALETTE.ink, letterSpacing: "0.01em" }}
            >
              容器管理
            </h2>
            <p
              className="mt-1.5 text-[15px]"
              style={{ color: PALETTE.inkSoft, letterSpacing: "0.01em" }}
            >
              查看并管理所有的 Docker 容器实例。
            </p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative w-80">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: PALETTE.inkFaint }}
                strokeWidth={1.7}
              />
              <input
                placeholder="搜索容器名称、镜像或 ID..."
                className="h-11 w-full rounded-full border pl-11 pr-4 text-sm outline-none transition-colors duration-200 placeholder:font-normal"
                style={{
                  backgroundColor: PALETTE.panel,
                  borderColor: PALETTE.hairline,
                  color: PALETTE.ink,
                  fontFamily: MONO,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = PALETTE.sage;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = PALETTE.hairline;
                }}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 select-none">
              <span
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                style={{ backgroundColor: PALETTE.sage }}
              >
                <span
                  className="inline-block h-5 w-5 translate-x-[22px] rounded-full bg-white transition-transform duration-200"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
                />
              </span>
              <span
                className="whitespace-nowrap text-sm"
                style={{ color: PALETTE.inkSoft }}
              >
                显示停止的容器
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: PALETTE.panel,
                borderColor: PALETTE.hairline,
                color: PALETTE.inkSoft,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PALETTE.panelAlt;
                e.currentTarget.style.borderColor = PALETTE.slate;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = PALETTE.panel;
                e.currentTarget.style.borderColor = PALETTE.hairline;
              }}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.7} /> 刷新
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white transition-colors duration-200"
              style={{ backgroundColor: PALETTE.sage }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PALETTE.sageInk;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = PALETTE.sage;
              }}
            >
              <PlusCircle className="h-4 w-4" strokeWidth={1.7} /> 新建容器
            </button>
          </div>
        </div>

        {/* Table card */}
        <div
          className="overflow-hidden rounded-3xl border"
          style={{
            backgroundColor: PALETTE.panel,
            borderColor: PALETTE.hairline,
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: PALETTE.panelAlt }}>
                {["名称", "状态", "镜像", "端口映射", "创建时间"].map((h) => (
                  <th
                    key={h}
                    className="px-7 py-4 text-left text-xs font-medium uppercase"
                    style={{
                      color: PALETTE.inkFaint,
                      letterSpacing: "0.08em",
                      borderBottom: `1px solid ${PALETTE.hairline}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th
                  className="px-7 py-4 text-right text-xs font-medium uppercase"
                  style={{
                    color: PALETTE.inkFaint,
                    letterSpacing: "0.08em",
                    borderBottom: `1px solid ${PALETTE.hairline}`,
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTAINERS.map((c, idx) => {
                const isRunning = c.state === "running";
                const last = idx === MOCK_CONTAINERS.length - 1;
                return (
                  <tr
                    key={c.id}
                    className="transition-colors duration-200"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PALETTE.panelAlt;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Name */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: isRunning
                              ? PALETTE.sage
                              : PALETTE.inkFaint,
                            boxShadow: isRunning
                              ? `0 0 0 4px ${PALETTE.sageBg}`
                              : `0 0 0 4px ${PALETTE.slateBg}`,
                          }}
                        />
                        <div>
                          <div
                            className="text-sm"
                            style={{ color: PALETTE.ink, fontFamily: MONO }}
                          >
                            {c.name}
                          </div>
                          <div
                            className="mt-1 text-xs"
                            style={{
                              color: PALETTE.inkFaint,
                              fontFamily: MONO,
                            }}
                          >
                            {c.id.substring(0, 12)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs capitalize"
                        style={{
                          backgroundColor: isRunning
                            ? PALETTE.sageBg
                            : PALETTE.slateBg,
                          color: isRunning ? PALETTE.sageInk : PALETTE.inkSoft,
                          fontFamily: MONO,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {c.state}
                      </span>
                    </td>

                    {/* Image */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <div
                        className="max-w-[220px] truncate text-xs"
                        style={{ color: PALETTE.inkSoft, fontFamily: MONO }}
                        title={c.image}
                      >
                        {c.image}
                      </div>
                    </td>

                    {/* Ports */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {c.ports.map((p, i) => (
                          <span
                            key={i}
                            className="rounded-md px-2 py-1 text-xs"
                            style={{
                              backgroundColor: PALETTE.dustyBg,
                              color: PALETTE.dustyInk,
                              fontFamily: MONO,
                            }}
                          >
                            {p.publicPort ? `${p.publicPort}→` : ""}
                            {p.privatePort}/{p.type}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Created */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: PALETTE.inkSoft }}
                      >
                        {c.createdLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-7 py-6"
                      style={{
                        borderBottom: last
                          ? "none"
                          : `1px solid ${PALETTE.hairlineSoft}`,
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <IconButton title="查看日志">
                          <Terminal className="h-4 w-4" strokeWidth={1.7} />
                        </IconButton>
                        {isRunning ? (
                          <>
                            <IconButton title="停止">
                              <Square className="h-4 w-4" strokeWidth={1.7} />
                            </IconButton>
                            <IconButton title="重启">
                              <RefreshCw
                                className="h-4 w-4"
                                strokeWidth={1.7}
                              />
                            </IconButton>
                          </>
                        ) : (
                          <IconButton title="启动">
                            <Play className="h-4 w-4" strokeWidth={1.7} />
                          </IconButton>
                        )}
                        <IconButton title="删除" tone="danger">
                          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
