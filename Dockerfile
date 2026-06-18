# Docker 管理中心 —— 单容器构建（前端静态文件由 Express 同进程托管）
# 在 Linux 容器内完成依赖安装与构建，彻底规避 Windows 上的 Node/pnpm 安装问题。
#
# 注意：基础镜像通过 DaoCloud 公共镜像加速地址拉取，避免本机 Docker Desktop
# 配置的镜像源（registry-mirror）失效导致 "failed to resolve source metadata" 报错。
# 如果你的 Docker Desktop 镜像源已正常，可改回官方短名：FROM node:22-slim
FROM docker.m.daocloud.io/library/node:22-slim

WORKDIR /app

# 启用 corepack 提供的 pnpm（与项目锁文件版本一致）
RUN corepack enable

# 使用国内 npm 镜像 + 加大网络重试/超时，避免在中国大陆网络下
# 访问 registry.npmjs.org 速度过慢（"below 50 KiB/s ... retry"）导致
# pnpm install 下载超时、exit code 1。镜像内容与官方一致，integrity 校验照常通过。
RUN printf '%s\n' \
    'registry=https://registry.npmmirror.com' \
    'fetch-retries=5' \
    'fetch-retry-mintimeout=20000' \
    'fetch-retry-maxtimeout=180000' \
    'fetch-timeout=600000' \
    'network-concurrency=8' \
    >> /root/.npmrc

# 复制全部源码（node_modules / dist 等已由 .dockerignore 排除）
COPY . .

# 安装依赖（容器内为干净的 Linux 环境，pnpm 可正常工作）
RUN pnpm install --frozen-lockfile

# 构建后端（esbuild 自包含打包）与前端（Vite，base=/ 以便从根路径托管）
RUN pnpm --filter @workspace/api-server run build \
 && PORT=8080 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/docker-manager run build

ENV NODE_ENV=production \
    PORT=8080 \
    PUBLIC_DIR=/app/artifacts/docker-manager/dist/public

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
