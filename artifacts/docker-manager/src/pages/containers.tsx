import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Box, Play, Square, RefreshCw, Trash2, Terminal as TerminalIcon,
  Search, PlusCircle, Loader2, Plus, X,
} from "lucide-react";
import {
  useListContainers, useStartContainer, useStopContainer,
  useRestartContainer, useDeleteContainer, useFetchContainerLogs,
  getListContainersQueryKey,
} from "@workspace/api-client-react";
import { formatRelative } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

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

const GRID_COLS = "1.6fr 0.9fr 1.7fr 1.6fr 1fr 1.3fr";

function IconBtn({
  title, children, color, hoverBg, onClick,
}: {
  title: string;
  children: React.ReactNode;
  color: string;
  hoverBg: string;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
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

function ToolbarBtn({
  label, icon, accent, primary, bracket, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  primary?: boolean;
  bracket?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex h-9 items-center gap-2 rounded-[4px] border px-3.5 text-[12.5px] font-medium transition-all duration-100"
      style={{
        color: accent,
        borderColor: hover ? accent : primary ? accent : PALETTE.line,
        background: primary
          ? hover ? "rgba(62,240,122,0.18)" : "rgba(62,240,122,0.1)"
          : hover ? "rgba(92,224,230,0.1)" : PALETTE.panelAlt,
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

function LogsModal({ containerId, isOpen, onClose, containerName }: {
  containerId: string | null; isOpen: boolean; onClose: () => void; containerName: string;
}) {
  const { data: logsData, isLoading } = useFetchContainerLogs(containerId || "");
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-[#0a0e12] border-[#16202a] text-gray-300">
        <DialogHeader>
          <DialogTitle className="text-gray-100 font-mono flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-[#3ef07a]" /> {containerName} 日志
          </DialogTitle>
          <DialogDescription className="text-gray-400">显示最后 100 行日志输出。</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 relative rounded-md border border-[#16202a] bg-black">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">加载中...</div>
          ) : (
            <ScrollArea className="h-[500px] w-full p-4 font-mono text-xs whitespace-pre">
              {logsData?.logs || "无日志输出"}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PortBinding { hostPort: string; containerPort: string; protocol: string; }
interface EnvVar { key: string; value: string; }
interface VolumeMount { source: string; target: string; }

const QUICK_TEMPLATES = [
  {
    label: "Nginx", image: "nginx:latest", name: "nginx",
    ports: [{ hostPort: "80", containerPort: "80", protocol: "tcp" }],
    env: [], volumes: [], restart: "unless-stopped",
  },
  {
    label: "Redis", image: "redis:alpine", name: "redis",
    ports: [{ hostPort: "6379", containerPort: "6379", protocol: "tcp" }],
    env: [], volumes: [{ source: "redis_data", target: "/data" }], restart: "unless-stopped",
  },
  {
    label: "MySQL", image: "mysql:8.0", name: "mysql",
    ports: [{ hostPort: "3306", containerPort: "3306", protocol: "tcp" }],
    env: [{ key: "MYSQL_ROOT_PASSWORD", value: "rootpass" }, { key: "MYSQL_DATABASE", value: "mydb" }],
    volumes: [{ source: "mysql_data", target: "/var/lib/mysql" }], restart: "unless-stopped",
  },
  {
    label: "PostgreSQL", image: "postgres:16-alpine", name: "postgres",
    ports: [{ hostPort: "5432", containerPort: "5432", protocol: "tcp" }],
    env: [{ key: "POSTGRES_PASSWORD", value: "postgres" }, { key: "POSTGRES_DB", value: "mydb" }],
    volumes: [{ source: "pg_data", target: "/var/lib/postgresql/data" }], restart: "unless-stopped",
  },
];

export default function Containers() {
  const [showAll, setShowAll] = useState(true);
  const [search, setSearch] = useState("");
  const { data: containers, isLoading } = useListContainers({ all: showAll });

  const startContainer = useStartContainer();
  const stopContainer = useStopContainer();
  const restartContainer = useRestartContainer();
  const deleteContainer = useDeleteContainer();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [logsContainerId, setLogsContainerId] = useState<string | null>(null);
  const [logsContainerName, setLogsContainerName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Create container dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createImage, setCreateImage] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRestart, setCreateRestart] = useState("no");
  const [createAutoStart, setCreateAutoStart] = useState(true);
  const [portBindings, setPortBindings] = useState<PortBinding[]>([{ hostPort: "", containerPort: "", protocol: "tcp" }]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);
  const [volumes, setVolumes] = useState<VolumeMount[]>([{ source: "", target: "" }]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListContainersQueryKey({ all: showAll }) });

  const openCreateModal = () => {
    setCreateImage(""); setCreateName(""); setCreateRestart("no"); setCreateAutoStart(true);
    setPortBindings([{ hostPort: "", containerPort: "", protocol: "tcp" }]);
    setEnvVars([{ key: "", value: "" }]);
    setVolumes([{ source: "", target: "" }]);
    setCreateOpen(true);
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setCreateImage(tpl.image);
    setCreateName(tpl.name);
    setCreateRestart(tpl.restart);
    setPortBindings(tpl.ports.length ? tpl.ports : [{ hostPort: "", containerPort: "", protocol: "tcp" }]);
    setEnvVars(tpl.env.length ? tpl.env : [{ key: "", value: "" }]);
    setVolumes(tpl.volumes.length ? tpl.volumes : [{ source: "", target: "" }]);
  };

  const handleCreateContainer = async () => {
    if (!createImage.trim()) {
      toast({ variant: "destructive", title: "错误", description: "请填写镜像地址" });
      return;
    }
    setCreating(true);
    try {
      const resp = await fetch("/api/containers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: createImage.trim(),
          name: createName.trim() || undefined,
          portBindings: portBindings.filter((p) => p.containerPort.trim()),
          env: envVars.filter((e) => e.key.trim()).map((e) => `${e.key}=${e.value}`),
          binds: volumes.filter((v) => v.source.trim() && v.target.trim()).map((v) => `${v.source}:${v.target}`),
          restartPolicy: createRestart,
          autoStart: createAutoStart,
        }),
      });
      const data = (await resp.json()) as { success: boolean; message: string };
      if (data.success) {
        toast({ title: "✅ " + data.message });
        setCreateOpen(false);
        refresh();
      } else {
        toast({ variant: "destructive", title: "创建失败", description: data.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "请求错误", description: String(err) });
    } finally {
      setCreating(false);
    }
  };

  const handleAction = (action: "start" | "stop" | "restart", id: string) => {
    const onSuccess = () => { toast({ title: "操作成功" }); refresh(); };
    if (action === "start") startContainer.mutate({ id }, { onSuccess });
    if (action === "stop") stopContainer.mutate({ id }, { onSuccess });
    if (action === "restart") restartContainer.mutate({ id }, { onSuccess });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteContainer.mutate({ id: deleteTarget.id }, {
      onSuccess: () => { toast({ title: "已删除", description: `容器 ${deleteTarget.name} 已删除` }); refresh(); setDeleteTarget(null); },
      onError: (e) => { toast({ variant: "destructive", title: "删除失败", description: String(e) }); setDeleteTarget(null); },
    });
  };

  const filteredContainers = containers?.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.names.some((n) => n.toLowerCase().includes(term)) || c.image.toLowerCase().includes(term) || c.id.toLowerCase().includes(term);
  });

  const runningCount = (containers || []).filter((c) => c.state === "running").length;
  const totalCount = (containers || []).length;

  // Port binding helpers
  const updatePort = (i: number, field: keyof PortBinding, val: string) =>
    setPortBindings((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const addPort = () => setPortBindings((p) => [...p, { hostPort: "", containerPort: "", protocol: "tcp" }]);
  const removePort = (i: number) => setPortBindings((p) => p.filter((_, idx) => idx !== i));

  // Env helpers
  const updateEnv = (i: number, field: "key" | "value", val: string) =>
    setEnvVars((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addEnv = () => setEnvVars((p) => [...p, { key: "", value: "" }]);
  const removeEnv = (i: number) => setEnvVars((p) => p.filter((_, idx) => idx !== i));

  // Volume helpers
  const updateVol = (i: number, field: "source" | "target", val: string) =>
    setVolumes((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  const addVol = () => setVolumes((p) => [...p, { source: "", target: "" }]);
  const removeVol = (i: number) => setVolumes((p) => p.filter((_, idx) => idx !== i));

  return (
    <div
      className="rounded-[8px]"
      style={{
        background: PALETTE.bg,
        fontFamily: MONO,
        color: PALETTE.text,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(62,240,122,0.025) 0px, rgba(62,240,122,0.025) 1px, transparent 1px, transparent 3px)",
      }}
    >
      <div className="px-5 py-5 sm:px-8 sm:py-7">
        {/* Window chrome bar */}
        <div
          className="flex items-center gap-3 rounded-t-[6px] border px-4 py-2.5"
          style={{ background: PALETTE.panelAlt, borderColor: PALETTE.line }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: PALETTE.red }} />
            <span className="h-3 w-3 rounded-full" style={{ background: PALETTE.amber }} />
            <span className="h-3 w-3 rounded-full" style={{ background: PALETTE.green }} />
          </span>
          <span className="ml-2 flex items-center gap-2 text-[12px]" style={{ color: PALETTE.dim }}>
            <TerminalIcon className="h-3.5 w-3.5" style={{ color: PALETTE.greenDim }} />
            <span className="hidden sm:inline">codex@管理中心 — ~/docker/containers — zsh</span>
            <span className="sm:hidden">~/docker/containers</span>
          </span>
          <span className="ml-auto text-[11px]" style={{ color: PALETTE.dim }}>
            {runningCount} active · {totalCount} total
          </span>
        </div>

        {/* Main terminal body */}
        <div
          className="rounded-b-[6px] border border-t-0 px-4 py-5 sm:px-7 sm:py-6"
          style={{
            background: PALETTE.panel,
            borderColor: PALETTE.line,
            boxShadow: "inset 0 0 120px rgba(62,240,122,0.03)",
          }}
        >
          {/* Header / prompt */}
          <div className="mb-1 flex items-baseline gap-2">
            <span style={{ color: PALETTE.greenDim }}>$</span>
            <h2 className="text-[22px] font-bold tracking-tight" style={{ color: PALETTE.green }}>
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
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: PALETTE.greenDim }} />
              <span className="absolute left-[30px] top-1/2 -translate-y-1/2 text-[12.5px]" style={{ color: PALETTE.greenDim }}>❯</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索容器名称、镜像或 ID..."
                className="h-9 w-full rounded-[4px] border bg-transparent pl-[46px] pr-3 text-[12.5px] outline-none transition-colors placeholder:opacity-50 focus:border-[#3ef07a]"
                style={{ borderColor: PALETTE.line, background: PALETTE.panelAlt, color: PALETTE.textBright }}
              />
            </div>

            {/* Toggle: show stopped containers */}
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-2.5 text-[12.5px] transition-colors"
              style={{ color: PALETTE.text }}
            >
              <span
                className="relative flex h-[18px] w-[34px] items-center rounded-[3px] border px-[2px] transition-colors"
                style={{
                  borderColor: showAll ? PALETTE.greenDim : PALETTE.line,
                  background: showAll ? "rgba(62,240,122,0.12)" : PALETTE.panelAlt,
                }}
              >
                <span
                  className="h-[12px] w-[12px] rounded-[2px] transition-transform duration-150"
                  style={{
                    background: showAll ? PALETTE.green : PALETTE.dim,
                    transform: showAll ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </span>
              <span style={{ color: PALETTE.dim }}>[</span>
              显示停止的容器
              <span style={{ color: PALETTE.dim }}>]</span>
            </button>

            <div className="ml-auto flex items-center gap-2.5">
              <ToolbarBtn label="刷新" icon={<RefreshCw className="h-3.5 w-3.5" />} accent={PALETTE.cyan} onClick={refresh} />
              <ToolbarBtn label="新建容器" icon={<PlusCircle className="h-3.5 w-3.5" />} accent={PALETTE.green} primary bracket onClick={openCreateModal} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[5px] border" style={{ borderColor: PALETTE.line, background: PALETTE.panelAlt }}>
            {/* header */}
            <div
              className="grid items-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                gridTemplateColumns: GRID_COLS,
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

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px]" style={{ color: PALETTE.dim }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: PALETTE.greenDim }} />
                <span style={{ color: PALETTE.greenDim }}># </span>正在加载容器列表...
              </div>
            ) : !filteredContainers || filteredContainers.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12.5px]" style={{ color: PALETTE.dim }}>
                <span style={{ color: PALETTE.greenDim }}># </span>
                {search ? "没有找到匹配的容器" : "暂无容器实例"}
              </div>
            ) : (
              filteredContainers.map((container, idx) => {
                const name = container.names[0]?.replace(/^\//, "") || container.id.substring(0, 12);
                const isRunning = container.state === "running";
                return (
                  <div
                    key={container.id}
                    className="grid items-center px-4 py-2.5 text-[12.5px] transition-colors"
                    style={{
                      gridTemplateColumns: GRID_COLS,
                      borderBottom: idx === filteredContainers.length - 1 ? "none" : `1px solid ${PALETTE.lineSoft}`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(62,240,122,0.045)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2.5 pr-3">
                      <span
                        className="text-[13px] leading-none"
                        style={{
                          color: isRunning ? PALETTE.green : PALETTE.dim,
                          textShadow: isRunning ? `0 0 6px ${PALETTE.green}` : "none",
                        }}
                      >
                        {isRunning ? "●" : "○"}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium" style={{ color: PALETTE.textBright }}>{name}</div>
                        <div className="truncate text-[11px]" style={{ color: PALETTE.dim }}>{container.id.substring(0, 12)}</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className="inline-flex items-center rounded-[3px] border px-2 py-[2px] text-[11px] capitalize"
                        style={
                          isRunning
                            ? { color: PALETTE.green, borderColor: PALETTE.greenDim, background: "rgba(62,240,122,0.08)" }
                            : { color: PALETTE.dim, borderColor: PALETTE.line, background: "rgba(75,92,102,0.08)" }
                        }
                      >
                        {container.state}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="truncate pr-3" style={{ color: PALETTE.text }} title={container.image}>
                      <span style={{ color: PALETTE.dim }}>::</span> {container.image}
                    </div>

                    {/* Ports */}
                    <div className="flex flex-wrap gap-1.5 pr-3">
                      {container.ports.length === 0 ? (
                        <span style={{ color: "#2c3a42" }}>—</span>
                      ) : (
                        container.ports.map((p, i) => (
                          <span
                            key={i}
                            className="rounded-[3px] border px-1.5 py-[1px] text-[11px]"
                            style={{ color: PALETTE.cyan, borderColor: "rgba(92,224,230,0.25)", background: "rgba(92,224,230,0.06)" }}
                          >
                            {p.publicPort ? `${p.publicPort}→` : ""}{p.privatePort}/{p.type}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Created */}
                    <div className="text-[12px]" style={{ color: PALETTE.dim }}>{formatRelative(container.created)}</div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn
                        title="查看日志"
                        color={PALETTE.dim}
                        hoverBg="rgba(185,199,207,0.08)"
                        onClick={() => { setLogsContainerId(container.id); setLogsContainerName(name); }}
                      >
                        <TerminalIcon className="h-3.5 w-3.5" />
                      </IconBtn>
                      {isRunning ? (
                        <>
                          <IconBtn title="停止" color={PALETTE.amber} hoverBg="rgba(245,185,66,0.1)" onClick={() => handleAction("stop", container.id)}>
                            <Square className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn title="重启" color={PALETTE.cyan} hoverBg="rgba(92,224,230,0.1)" onClick={() => handleAction("restart", container.id)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </IconBtn>
                        </>
                      ) : (
                        <IconBtn title="启动" color={PALETTE.green} hoverBg="rgba(62,240,122,0.1)" onClick={() => handleAction("start", container.id)}>
                          <Play className="h-3.5 w-3.5" />
                        </IconBtn>
                      )}
                      <IconBtn title="删除" color={PALETTE.red} hoverBg="rgba(255,95,86,0.1)" onClick={() => setDeleteTarget({ id: container.id, name })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer prompt line */}
          <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: PALETTE.dim }}>
            <Box className="h-3.5 w-3.5" style={{ color: PALETTE.greenDim }} />
            <span style={{ color: PALETTE.greenDim }}>codex</span>
            <span>:</span>
            <span style={{ color: PALETTE.cyan }}>~/docker/containers</span>
            <span style={{ color: PALETTE.green }}>$</span>
            <span
              className="inline-block h-[14px] w-[8px]"
              style={{ background: PALETTE.green, animation: "term-blink 1.1s steps(1) infinite" }}
            />
          </div>
        </div>
      </div>

      {/* Create Container Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!creating) setCreateOpen(o); }}>
        <DialogContent className="bg-[#0a0e12] border border-[#16202a] max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: MONO }}>
          <DialogHeader>
            <DialogTitle className="text-[#3ef07a] flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> 新建容器
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">配置镜像、端口、环境变量和数据卷后创建并启动容器。</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Quick templates */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">快速模板</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => applyTemplate(tpl)}
                    className="text-xs px-3 py-1.5 rounded border border-[#16202a] bg-[#0c1116] hover:border-[#3ef07a]/40 hover:text-[#3ef07a] text-muted-foreground transition-colors font-mono"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic config */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">基本配置</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">镜像地址 <span className="text-[#ff5f56]">*</span></Label>
                  <Input value={createImage} onChange={(e) => setCreateImage(e.target.value)}
                    placeholder="nginx:latest / mysql:8.0 / your-image:tag" className="font-mono text-sm bg-[#0c1116]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">容器名称（可选）</Label>
                  <Input value={createName} onChange={(e) => setCreateName(e.target.value)}
                    placeholder="my-container" className="font-mono text-sm bg-[#0c1116]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">重启策略</Label>
                  <Select value={createRestart} onValueChange={setCreateRestart}>
                    <SelectTrigger className="bg-[#0c1116] font-mono text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0a0e12] border-[#16202a]">
                      <SelectItem value="no">no（不自动重启）</SelectItem>
                      <SelectItem value="always">always（始终重启）</SelectItem>
                      <SelectItem value="unless-stopped">unless-stopped（推荐）</SelectItem>
                      <SelectItem value="on-failure">on-failure（失败时重启）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Port bindings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">端口映射</Label>
                <Button variant="ghost" size="sm" onClick={addPort} className="h-6 text-xs text-[#5ce0e6] hover:text-[#5ce0e6]/80 px-2">
                  <Plus className="w-3 h-3 mr-1" /> 添加
                </Button>
              </div>
              <div className="space-y-2">
                {portBindings.map((pb, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={pb.hostPort} onChange={(e) => updatePort(i, "hostPort", e.target.value)}
                      placeholder="主机端口 (如 8080)" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <span className="text-muted-foreground text-sm flex-shrink-0">→</span>
                    <Input value={pb.containerPort} onChange={(e) => updatePort(i, "containerPort", e.target.value)}
                      placeholder="容器端口 (如 80)" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <Select value={pb.protocol} onValueChange={(v) => updatePort(i, "protocol", v)}>
                      <SelectTrigger className="bg-[#0c1116] font-mono text-xs h-8 w-20 flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0a0e12] border-[#16202a]">
                        <SelectItem value="tcp">tcp</SelectItem>
                        <SelectItem value="udp">udp</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removePort(i)} className="h-8 w-8 text-[#ff5f56]/60 hover:text-[#ff5f56] flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Env vars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">环境变量</Label>
                <Button variant="ghost" size="sm" onClick={addEnv} className="h-6 text-xs text-[#5ce0e6] hover:text-[#5ce0e6]/80 px-2">
                  <Plus className="w-3 h-3 mr-1" /> 添加
                </Button>
              </div>
              <div className="space-y-2">
                {envVars.map((ev, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={ev.key} onChange={(e) => updateEnv(i, "key", e.target.value)}
                      placeholder="KEY" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <span className="text-muted-foreground text-sm flex-shrink-0">=</span>
                    <Input value={ev.value} onChange={(e) => updateEnv(i, "value", e.target.value)}
                      placeholder="VALUE" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeEnv(i)} className="h-8 w-8 text-[#ff5f56]/60 hover:text-[#ff5f56] flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume mounts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">数据卷挂载</Label>
                <Button variant="ghost" size="sm" onClick={addVol} className="h-6 text-xs text-[#5ce0e6] hover:text-[#5ce0e6]/80 px-2">
                  <Plus className="w-3 h-3 mr-1" /> 添加
                </Button>
              </div>
              <div className="space-y-2">
                {volumes.map((vol, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={vol.source} onChange={(e) => updateVol(i, "source", e.target.value)}
                      placeholder="来源 (卷名或主机路径)" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <span className="text-muted-foreground text-sm flex-shrink-0">:</span>
                    <Input value={vol.target} onChange={(e) => updateVol(i, "target", e.target.value)}
                      placeholder="容器内路径 (如 /data)" className="font-mono text-xs bg-[#0c1116] h-8 flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeVol(i)} className="h-8 w-8 text-[#ff5f56]/60 hover:text-[#ff5f56] flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto start toggle */}
            <div className="flex items-center gap-3 pt-1">
              <Switch id="auto-start" checked={createAutoStart} onCheckedChange={setCreateAutoStart} />
              <Label htmlFor="auto-start" className="text-sm cursor-pointer">创建后立即启动容器</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>取消</Button>
            <Button
              className="bg-[#1f8f48] hover:bg-[#3ef07a] text-black font-medium"
              onClick={handleCreateContainer}
              disabled={creating || !createImage.trim()}
            >
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中...</> : <><Box className="w-4 h-4 mr-2" />创建容器</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="bg-[#0a0e12] border border-[#16202a] max-w-sm" style={{ fontFamily: MONO }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#ff5f56]" /> 确认删除容器
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              即将强制删除容器 <span className="font-mono text-[#ff5f56]">{deleteTarget?.name}</span>。
              容器内未挂载的数据将丢失。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-[#16202a]" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-[#ff5f56] hover:bg-[#ff5f56]/85 text-black font-medium" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogsModal containerId={logsContainerId} containerName={logsContainerName} isOpen={!!logsContainerId} onClose={() => setLogsContainerId(null)} />

      <style>{`@keyframes term-blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }`}</style>
    </div>
  );
}
