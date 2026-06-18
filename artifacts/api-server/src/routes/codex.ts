import { Router } from "express";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

// ── 环境检测 ────────────────────────────────────────────────────────────────
// 管理中心是否以「本机原生进程」运行（能写宿主机 ~/.codex），还是跑在 Docker 容器里。
function isContainer(): boolean {
  // 显式开关优先（便于本机测试容器降级路径）。
  const flag = process.env.CODEX_FORCE_CONTAINER;
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  try {
    if (existsSync("/.dockerenv")) return true;
    // 部分容器运行时没有 /.dockerenv，再看 cgroup 是否含 docker/kubepods/containerd。
    if (existsSync("/proc/1/cgroup")) {
      const cgroup = readFileSync("/proc/1/cgroup", "utf8");
      if (/docker|kubepods|containerd|libpod/i.test(cgroup)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function codexPaths() {
  const home = homedir();
  const codexDir = join(home, ".codex");
  return {
    home,
    codexDir,
    configPath: join(codexDir, "config.toml"),
    agentsPath: join(codexDir, "AGENTS.md"),
  };
}

async function detectCodexCli(): Promise<{ installed: boolean; version: string }> {
  const candidates = process.platform === "win32" ? ["codex.cmd", "codex"] : ["codex"];
  for (const bin of candidates) {
    try {
      const { stdout } = await execFileAsync(bin, ["--version"], { timeout: 5000 });
      return { installed: true, version: stdout.trim().split("\n")[0] || "已安装" };
    } catch {
      /* try next */
    }
  }
  return { installed: false, version: "" };
}

// 检测 uv/uvx（git MCP 通过 uvx 运行，需要本机安装 Python 的 uv）。
async function detectUv(): Promise<{ installed: boolean; version: string }> {
  const candidates = process.platform === "win32" ? ["uvx.cmd", "uvx", "uv"] : ["uvx", "uv"];
  for (const bin of candidates) {
    try {
      const { stdout } = await execFileAsync(bin, ["--version"], { timeout: 5000 });
      return { installed: true, version: stdout.trim().split("\n")[0] || "已安装" };
    } catch {
      /* try next */
    }
  }
  return { installed: false, version: "" };
}

// ── MCP 工具目录 ──────────────────────────────────────────────────────────────
// 仅收录确实存在于 npm 的官方 MCP 服务器（git 通过 Python/uv 运行）。
interface McpDef {
  id: string;
  name: string;
  desc: string;
  runner: "npx" | "uvx";
  pkg: string;
  extraArgs?: string[];
  note?: string;
  defaultOn?: boolean;
}

const MCP_CATALOG: McpDef[] = [
  {
    id: "filesystem",
    name: "文件系统",
    desc: "让 Codex 读写当前工作目录的文件",
    runner: "npx",
    pkg: "@modelcontextprotocol/server-filesystem",
    extraArgs: ["."],
    defaultOn: true,
  },
  {
    id: "memory",
    name: "长期记忆",
    desc: "知识图谱式记忆，跨会话记住上下文",
    runner: "npx",
    pkg: "@modelcontextprotocol/server-memory",
  },
  {
    id: "sequential-thinking",
    name: "逐步思考",
    desc: "把复杂问题拆解为分步推理",
    runner: "npx",
    pkg: "@modelcontextprotocol/server-sequential-thinking",
  },
  {
    id: "git",
    name: "Git 操作",
    desc: "读取/提交 Git 仓库（需要本机安装 Python 的 uv）",
    runner: "uvx",
    pkg: "mcp-server-git",
    note: "需要先安装 uv（Python）：https://docs.astral.sh/uv/",
  },
];

// ── config.toml 生成 ──────────────────────────────────────────────────────────
function tomlString(v: string): string {
  return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function tomlArray(items: string[]): string {
  return `[${items.map(tomlString).join(", ")}]`;
}

function normalizeBaseUrl(ollamaUrl: string): string {
  const trimmed = (ollamaUrl || "http://localhost:11434").replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

// 在 Windows 上 npx/uvx 通常需要经过 cmd /c 才能被 Codex 正确拉起。
function mcpCommand(def: McpDef, platform: NodeJS.Platform): { command: string; args: string[] } {
  const base = def.runner === "npx" ? ["npx", "-y", def.pkg] : ["uvx", def.pkg];
  const full = [...base, ...(def.extraArgs ?? [])];
  if (platform === "win32") {
    return { command: "cmd", args: ["/c", ...full] };
  }
  return { command: full[0], args: full.slice(1) };
}

function generateConfigToml(opts: {
  model: string;
  ollamaUrl: string;
  mcpIds: string[];
  platform: NodeJS.Platform;
  filesystemDir?: string;
  customMcpToml?: string;
}): string {
  const baseUrl = normalizeBaseUrl(opts.ollamaUrl);
  const model = opts.model || "qwen2.5-coder:7b";
  const fsDir = (opts.filesystemDir || "").trim() || ".";

  const lines: string[] = [
    "# 由「Codex 管理中心」自动生成 — 本地 Ollama 配置",
    "# 新版 Codex（2026.02 起）只支持 Responses API：必须使用 wire_api = \"responses\"。",
    "# Ollama 需 ≥ 0.13.3 才提供 /v1/responses 接口（低版本会报 404）。",
    "",
    `model = ${tomlString(model)}`,
    `model_provider = "ollama-local"`,
    "",
    "# 注意：Codex 内置了名为 ollama 的 provider 且禁止覆盖，自定义 provider 必须改名（这里用 ollama-local）。",
    "[model_providers.ollama-local]",
    `name = "Ollama (本地)"`,
    `base_url = ${tomlString(baseUrl)}`,
    `wire_api = "responses"`,
  ];

  const selected = MCP_CATALOG.filter((m) => opts.mcpIds.includes(m.id));
  for (const def of selected) {
    // 文件系统 MCP 使用用户指定的工作目录（默认 "."）。
    const effective = def.id === "filesystem" ? { ...def, extraArgs: [fsDir] } : def;
    const { command, args } = mcpCommand(effective, opts.platform);
    lines.push("");
    if (effective.note) lines.push(`# ${effective.name} — ${effective.note}`);
    if (effective.id === "filesystem") lines.push(`# 文件系统 MCP 目标目录：${fsDir}`);
    lines.push(`[mcp_servers.${effective.id.replace(/-/g, "_")}]`);
    lines.push(`command = ${tomlString(command)}`);
    lines.push(`args = ${tomlArray(args)}`);
  }

  // 用户粘贴的自定义 [mcp_servers.*] 片段，原样合并到末尾。
  const custom = (opts.customMcpToml || "").replace(/\r\n/g, "\n").trim();
  if (custom) {
    lines.push("");
    lines.push("# ── 用户自定义 MCP 工具（原样合并）──");
    lines.push(...custom.split("\n"));
  }

  return lines.join("\n") + "\n";
}

// ── AGENTS.md（中文编程助手 skill 指令）────────────────────────────────────────
function generateAgentsMd(): string {
  return `# 全局编程助手指令（AGENTS.md）

> 由「Codex 管理中心」自动写入到 ~/.codex/AGENTS.md，对所有项目生效。

## 角色

你是一名严谨、务实的资深工程师助手，全程使用**简体中文**与我沟通。优先交付可运行的代码，而不是占位或伪造数据。

## 工作约定

- 先理解需求，再动手；需求不清晰时主动提出关键澄清问题，但不要无意义地反复确认。
- 修改代码前先阅读相关文件，遵循项目已有的结构、命名与代码风格。
- 改动尽量小而聚焦，不顺手做无关重构。
- 涉及删除文件、批量重构、改动依赖等有风险的操作前，先说明影响并征得我同意。
- 完成后用一两句话总结改了什么、为什么这样改。

## 安全边界

- 不要打印或写入任何密钥、令牌、密码等敏感信息。
- 不在未确认的情况下执行破坏性命令（删除数据、强制推送等）。
- 不联网安装来历不明的依赖；新增依赖前先说明用途。

## 常用工作流

- 定位问题：先用搜索快速找到相关代码，再精读必要片段。
- 修复 Bug：复现 → 定位根因 → 最小化修复 → 验证。
- 新增功能：理清边界 → 实现 → 自测 → 总结。
`;
}

// 备份已存在的文件为 <path>.bak-<时间戳>
function backupIfExists(path: string): string | null {
  if (!existsSync(path)) return null;
  const ts = new Date()
    .toISOString()
    .replace(/[:T]/g, "")
    .replace(/\..+/, "")
    .replace(/-/g, "");
  const backup = `${path}.bak-${ts}`;
  copyFileSync(path, backup);
  return backup;
}

// ── 路由 ───────────────────────────────────────────────────────────────────────

// 环境与就绪检测：能否一键写入宿主机配置
router.get("/codex/env", async (_req, res) => {
  const container = isContainer();
  const { home, codexDir, configPath, agentsPath } = codexPaths();
  const [codex, uv] = await Promise.all([detectCodexCli(), detectUv()]);

  return res.json({
    isContainer: container,
    isLocal: !container,
    platform: process.platform,
    homeDir: home,
    codexDir,
    configPath,
    configExists: existsSync(configPath),
    agentsPath,
    agentsExists: existsSync(agentsPath),
    codexInstalled: codex.installed,
    codexVersion: codex.version,
    uvInstalled: uv.installed,
    uvVersion: uv.version,
    mcpCatalog: MCP_CATALOG.map(({ id, name, desc, note, defaultOn }) => ({
      id,
      name,
      desc,
      note: note ?? null,
      defaultOn: !!defaultOn,
    })),
  });
});

// 一键写入 ~/.codex/config.toml + AGENTS.md（仅本机原生运行时）
router.post("/codex/apply", async (req, res) => {
  const {
    model = "",
    ollamaUrl = "http://localhost:11434",
    mcpServers = [],
    includeSkills = true,
    filesystemDir = ".",
    customMcpToml = "",
  } = req.body as {
    model?: string;
    ollamaUrl?: string;
    mcpServers?: string[];
    includeSkills?: boolean;
    filesystemDir?: string;
    customMcpToml?: string;
  };

  const validIds = new Set(MCP_CATALOG.map((m) => m.id));
  const mcpIds = (Array.isArray(mcpServers) ? mcpServers : []).filter((id) => validIds.has(id));
  const fsDir = typeof filesystemDir === "string" && filesystemDir.trim() ? filesystemDir.trim() : ".";
  const customToml = typeof customMcpToml === "string" ? customMcpToml : "";
  const launchCommand = "codex --dangerously-bypass-approvals-and-sandbox";

  // 容器内：无法写宿主机 ~/.codex，明确降级，返回可在本机执行的脚本与内容。
  if (isContainer()) {
    const winToml = generateConfigToml({ model, ollamaUrl, mcpIds, platform: "win32", filesystemDir: fsDir, customMcpToml: customToml });
    const nixToml = generateConfigToml({ model, ollamaUrl, mcpIds, platform: "linux", filesystemDir: fsDir, customMcpToml: customToml });
    const agentsMd = includeSkills ? generateAgentsMd() : "";

    const winScript = [
      "@echo off",
      "chcp 65001 >nul",
      'set "CODEX_DIR=%USERPROFILE%\\.codex"',
      'if not exist "%CODEX_DIR%" mkdir "%CODEX_DIR%"',
      'if exist "%CODEX_DIR%\\config.toml" copy /y "%CODEX_DIR%\\config.toml" "%CODEX_DIR%\\config.toml.bak" >nul',
      '> "%CODEX_DIR%\\config.toml" (',
      // echo( 同时正确处理空行与正文行，避免空行被写成字面量 "."（无效 TOML）。
      ...winToml.split("\n").map((l) => `echo(${l.replace(/[&<>|^%]/g, "^$&")}`),
      ")",
      'echo 已写入 "%CODEX_DIR%\\config.toml"',
      ...(agentsMd
        ? [
            'if exist "%CODEX_DIR%\\AGENTS.md" copy /y "%CODEX_DIR%\\AGENTS.md" "%CODEX_DIR%\\AGENTS.md.bak" >nul',
            '> "%CODEX_DIR%\\AGENTS.md" (',
            ...agentsMd.split("\n").map((l) => `echo(${l.replace(/[&<>|^%]/g, "^$&")}`),
            ")",
            'echo 已写入 "%CODEX_DIR%\\AGENTS.md"',
          ]
        : []),
      `echo 现在可运行： ${launchCommand}`,
    ].join("\r\n");

    return res.status(409).json({
      ok: false,
      notLocal: true,
      message:
        "管理中心正运行在 Docker 容器内，无法写入你电脑上的 ~/.codex。请改用本机原生方式运行管理中心（解压安装包后用 pnpm dev 启动），或把下面的内容/脚本拿到本机执行。",
      configPath: null,
      configToml: nixToml,
      configTomlWindows: winToml,
      agentsMd,
      windowsScript: winScript,
      launchCommand,
    });
  }

  // 本机原生：真实写入
  try {
    const { codexDir, configPath, agentsPath } = codexPaths();
    if (!existsSync(codexDir)) mkdirSync(codexDir, { recursive: true });

    const configToml = generateConfigToml({ model, ollamaUrl, mcpIds, platform: process.platform, filesystemDir: fsDir, customMcpToml: customToml });
    const backups: string[] = [];

    const cfgBackup = backupIfExists(configPath);
    if (cfgBackup) backups.push(cfgBackup);
    writeFileSync(configPath, configToml, "utf-8");

    const written = [configPath];
    let agentsMd = "";
    if (includeSkills) {
      agentsMd = generateAgentsMd();
      const agentsBackup = backupIfExists(agentsPath);
      if (agentsBackup) backups.push(agentsBackup);
      writeFileSync(agentsPath, agentsMd, "utf-8");
      written.push(agentsPath);
    }

    return res.json({
      ok: true,
      notLocal: false,
      written,
      backups,
      configPath,
      agentsPath: includeSkills ? agentsPath : null,
      configToml,
      agentsMd,
      mcpApplied: mcpIds,
      launchCommand,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, notLocal: false, message: `写入失败：${msg}` });
  }
});

export default router;
