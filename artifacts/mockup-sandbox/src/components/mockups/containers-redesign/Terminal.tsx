import { useState } from "react";
import {
  Box,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Terminal as TerminalIcon,
  Search,
  PlusCircle,
} from "lucide-react";
import { MOCK_CONTAINERS } from "./_data";

const PALETTE = {
  bg: "#05070a",
  panel: "#0a0e12",
  panelAlt: "#0c1116",
  line: "#16202a",
  lineSoft: "#101820",
  green: "#3ef07a",
  greenDim: "#1f8f48",
  amber: "#f5b942",
  cyan: "#5ce0e6",
  dim: "#4b5c66",
  text: "#b9c7cf",
  textBright: "#e3f0ec",
  red: "#ff5f56",
};

const MONO =
  "'JetBrains Mono', 'IBM Plex Mono', 'Roboto Mono', ui-monospace, monospace";

function IconBtn({
  title,
  children,
  color,
  hoverBg,
}: {
  title: string;
  children: React.ReactNode;
  color: string;
  hoverBg: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex h-7 w-7 items-center justify-center rounded-[3px] transition-colors duration-100"
      style={{
        color,
        background: hover ? hoverBg : "transparent",
        border: `1px solid ${hover ? color : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

export function Terminal() {
  const [showStopped, setShowStopped] = useState(true);
  const [search, setSearch] = useState("");

  const rows = MOCK_CONTAINERS;
  const runningCount = rows.filter((c) => c.state === "running").length;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: PALETTE.bg,
        fontFamily: MONO,
        color: PALETTE.text,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(62,240,122,0.025) 0px, rgba(62,240,122,0.025) 1px, transparent 1px, transparent 3px)",
      }}
    >
      <div className="mx-auto max-w-[1500px] px-10 py-9">
        {/* Window chrome bar */}
        <div
          className="flex items-center gap-3 rounded-t-[6px] border px-4 py-2.5"
          style={{
            background: PALETTE.panelAlt,
            borderColor: PALETTE.line,
          }}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: PALETTE.red }}
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: PALETTE.amber }}
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: PALETTE.green }}
            />
          </span>
          <span
            className="ml-2 flex items-center gap-2 text-[12px]"
            style={{ color: PALETTE.dim }}
          >
            <TerminalIcon className="h-3.5 w-3.5" style={{ color: PALETTE.greenDim }} />
            codex@管理中心 — ~/docker/containers — zsh
          </span>
          <span className="ml-auto text-[11px]" style={{ color: PALETTE.dim }}>
            {runningCount} active · {rows.length} total
          </span>
        </div>

        {/* Main terminal body */}
        <div
          className="rounded-b-[6px] border border-t-0 px-7 py-6"
          style={{
            background: PALETTE.panel,
            borderColor: PALETTE.line,
            boxShadow: "inset 0 0 120px rgba(62,240,122,0.03)",
          }}
        >
          {/* Header / prompt */}
          <div className="mb-1 flex items-baseline gap-2">
            <span style={{ color: PALETTE.greenDim }}>$</span>
            <h2
              className="text-[22px] font-bold tracking-tight"
              style={{ color: PALETTE.green }}
            >
              <span style={{ color: PALETTE.dim }}>&gt; </span>容器管理
              <span
                className="ml-1 inline-block h-[18px] w-[9px] translate-y-[2px]"
                style={{ background: PALETTE.green, animation: "term-blink 1.1s steps(1) infinite" }}
              />
            </h2>
          </div>
          <p className="mb-6 pl-4 text-[12.5px]" style={{ color: PALETTE.dim }}>
            <span style={{ color: PALETTE.greenDim }}># </span>
            查看并管理所有的 Docker 容器实例。
          </p>

          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[340px]">
              <Search
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: PALETTE.greenDim }}
              />
              <span
                className="absolute left-[30px] top-1/2 -translate-y-1/2 text-[12.5px]"
                style={{ color: PALETTE.greenDim }}
              >
                ❯
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索容器名称、镜像或 ID..."
                className="h-9 w-full rounded-[4px] border bg-transparent pl-[46px] pr-3 text-[12.5px] outline-none transition-colors placeholder:opacity-50 focus:border-[#3ef07a]"
                style={{
                  borderColor: PALETTE.line,
                  background: PALETTE.panelAlt,
                  color: PALETTE.textBright,
                }}
              />
            </div>

            {/* Toggle */}
            <button
              onClick={() => setShowStopped((v) => !v)}
              className="flex items-center gap-2.5 text-[12.5px] transition-colors"
              style={{ color: PALETTE.text }}
            >
              <span
                className="relative flex h-[18px] w-[34px] items-center rounded-[3px] border px-[2px] transition-colors"
                style={{
                  borderColor: showStopped ? PALETTE.greenDim : PALETTE.line,
                  background: showStopped ? "rgba(62,240,122,0.12)" : PALETTE.panelAlt,
                }}
              >
                <span
                  className="h-[12px] w-[12px] rounded-[2px] transition-transform duration-150"
                  style={{
                    background: showStopped ? PALETTE.green : PALETTE.dim,
                    transform: showStopped ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </span>
              <span style={{ color: PALETTE.dim }}>[</span>
              显示停止的容器
              <span style={{ color: PALETTE.dim }}>]</span>
            </button>

            <div className="ml-auto flex items-center gap-2.5">
              <ToolbarBtn
                label="刷新"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                accent={PALETTE.cyan}
              />
              <ToolbarBtn
                label="新建容器"
                icon={<PlusCircle className="h-3.5 w-3.5" />}
                accent={PALETTE.green}
                primary
                bracket
              />
            </div>
          </div>

          {/* Table */}
          <div
            className="overflow-hidden rounded-[5px] border"
            style={{ borderColor: PALETTE.line, background: PALETTE.panelAlt }}
          >
            {/* header */}
            <div
              className="grid items-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                gridTemplateColumns: "1.6fr 0.9fr 1.7fr 1.6fr 1fr 1.3fr",
                color: PALETTE.greenDim,
                borderBottom: `1px solid ${PALETTE.line}`,
                background: "rgba(62,240,122,0.03)",
              }}
            >
              <div>名称</div>
              <div>状态</div>
              <div>镜像</div>
              <div>端口映射</div>
              <div>创建时间</div>
              <div className="text-right">操作</div>
            </div>

            {rows.map((c, idx) => {
              const isRunning = c.state === "running";
              return (
                <div
                  key={c.id}
                  className="group grid items-center px-4 py-2.5 text-[12.5px] transition-colors"
                  style={{
                    gridTemplateColumns: "1.6fr 0.9fr 1.7fr 1.6fr 1fr 1.3fr",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : `1px solid ${PALETTE.lineSoft}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(62,240,122,0.045)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Name */}
                  <div className="flex items-center gap-2.5 pr-3">
                    <span
                      className="text-[13px] leading-none"
                      style={{
                        color: isRunning ? PALETTE.green : PALETTE.dim,
                        textShadow: isRunning
                          ? `0 0 6px ${PALETTE.green}`
                          : "none",
                      }}
                    >
                      {isRunning ? "●" : "○"}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="truncate font-medium"
                        style={{ color: PALETTE.textBright }}
                      >
                        {c.name}
                      </div>
                      <div
                        className="truncate text-[11px]"
                        style={{ color: PALETTE.dim }}
                      >
                        {c.id.substring(0, 12)}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className="inline-flex items-center rounded-[3px] border px-2 py-[2px] text-[11px] capitalize"
                      style={
                        isRunning
                          ? {
                              color: PALETTE.green,
                              borderColor: PALETTE.greenDim,
                              background: "rgba(62,240,122,0.08)",
                            }
                          : {
                              color: PALETTE.dim,
                              borderColor: PALETTE.line,
                              background: "rgba(75,92,102,0.08)",
                            }
                      }
                    >
                      {c.state}
                    </span>
                  </div>

                  {/* Image */}
                  <div
                    className="truncate pr-3"
                    style={{ color: PALETTE.text }}
                    title={c.image}
                  >
                    <span style={{ color: PALETTE.dim }}>::</span> {c.image}
                  </div>

                  {/* Ports */}
                  <div className="flex flex-wrap gap-1.5 pr-3">
                    {c.ports.length === 0 ? (
                      <span style={{ color: "#2c3a42" }}>—</span>
                    ) : (
                      c.ports.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-[3px] border px-1.5 py-[1px] text-[11px]"
                          style={{
                            color: PALETTE.cyan,
                            borderColor: "rgba(92,224,230,0.25)",
                            background: "rgba(92,224,230,0.06)",
                          }}
                        >
                          {p.publicPort ? `${p.publicPort}→` : ""}
                          {p.privatePort}/{p.type}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Created */}
                  <div className="text-[12px]" style={{ color: PALETTE.dim }}>
                    {c.createdLabel}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn
                      title="查看日志"
                      color={PALETTE.dim}
                      hoverBg="rgba(185,199,207,0.08)"
                    >
                      <TerminalIcon className="h-3.5 w-3.5" />
                    </IconBtn>
                    {isRunning ? (
                      <>
                        <IconBtn
                          title="停止"
                          color={PALETTE.amber}
                          hoverBg="rgba(245,185,66,0.1)"
                        >
                          <Square className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn
                          title="重启"
                          color={PALETTE.cyan}
                          hoverBg="rgba(92,224,230,0.1)"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </IconBtn>
                      </>
                    ) : (
                      <IconBtn
                        title="启动"
                        color={PALETTE.green}
                        hoverBg="rgba(62,240,122,0.1)"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn
                      title="删除"
                      color={PALETTE.red}
                      hoverBg="rgba(255,95,86,0.1)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer prompt line */}
          <div
            className="mt-4 flex items-center gap-2 text-[12px]"
            style={{ color: PALETTE.dim }}
          >
            <Box className="h-3.5 w-3.5" style={{ color: PALETTE.greenDim }} />
            <span style={{ color: PALETTE.greenDim }}>codex</span>
            <span>:</span>
            <span style={{ color: PALETTE.cyan }}>~/docker/containers</span>
            <span style={{ color: PALETTE.green }}>$</span>
            <span
              className="inline-block h-[14px] w-[8px]"
              style={{
                background: PALETTE.green,
                animation: "term-blink 1.1s steps(1) infinite",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes term-blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }
      `}</style>
    </div>
  );
}

function ToolbarBtn({
  label,
  icon,
  accent,
  primary,
  bracket,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  primary?: boolean;
  bracket?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex h-9 items-center gap-2 rounded-[4px] border px-3.5 text-[12.5px] font-medium transition-all duration-100"
      style={{
        color: accent,
        borderColor: hover ? accent : primary ? accent : PALETTE.line,
        background: primary
          ? hover
            ? "rgba(62,240,122,0.18)"
            : "rgba(62,240,122,0.1)"
          : hover
            ? "rgba(92,224,230,0.1)"
            : PALETTE.panelAlt,
        boxShadow: primary && hover ? `0 0 14px rgba(62,240,122,0.25)` : "none",
      }}
    >
      {icon}
      {bracket ? (
        <span>
          <span style={{ opacity: 0.6 }}>[ </span>
          {label}
          <span style={{ opacity: 0.6 }}> ]</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}
