import Dockerode from "dockerode";
import fs from "fs";

function createDockerClient(): Dockerode {
  const isWindows = process.platform === "win32";
  if (isWindows) {
    return new Dockerode({ socketPath: "//./pipe/docker_engine" });
  }
  return new Dockerode({ socketPath: "/var/run/docker.sock" });
}

export const docker = createDockerClient();

// 解析「后端进程实际用来访问 Ollama API 的主机名」。
// 关键点：当本平台自身运行在容器里时，`localhost` 指向的是它自己的容器，
// 而不是宿主机或 Ollama 容器，因此对 Ollama 的 HTTP 探测会失败
// （即便浏览器在宿主机上能正常访问 localhost:11434）。
// 优先级：显式 OLLAMA_HOST 环境变量 > 检测到在容器内则用 host.docker.internal > localhost。
function detectOllamaHost(): string {
  const envHost = process.env.OLLAMA_HOST?.trim();
  if (envHost) return envHost.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  try {
    // Docker 会在容器内创建 /.dockerenv 文件
    if (fs.existsSync("/.dockerenv")) return "host.docker.internal";
  } catch {
    /* 非容器环境，忽略 */
  }
  return "localhost";
}

export const ollamaHost = detectOllamaHost();

// 后端访问 Ollama API 的基础 URL（带正确主机名）。
export function ollamaApiUrl(port = 11434): string {
  return `http://${ollamaHost}:${port}`;
}

// 把来自浏览器视角的 URL（通常是 localhost）改写为后端可达的主机名。
// 用于「连接测试」「Codex 检查」等接受前端传入 URL 的场景。
export function toServerReachableOllamaUrl(url?: string, port = 11434): string {
  if (!url) return ollamaApiUrl(port);
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      u.hostname = ollamaHost;
    }
    return u.toString().replace(/\/+$/, "");
  } catch {
    return ollamaApiUrl(port);
  }
}
