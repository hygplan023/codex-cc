export interface MockPort {
  publicPort?: number;
  privatePort: number;
  type: string;
}

export interface MockContainer {
  id: string;
  name: string;
  state: "running" | "exited";
  image: string;
  ports: MockPort[];
  createdLabel: string;
}

export const MOCK_CONTAINERS: MockContainer[] = [
  {
    id: "a3f9c1e8b7d2",
    name: "ollama",
    state: "running",
    image: "ollama/ollama:latest",
    ports: [{ publicPort: 11434, privatePort: 11434, type: "tcp" }],
    createdLabel: "2 天前",
  },
  {
    id: "c8e2d4f1a905",
    name: "nginx-proxy",
    state: "running",
    image: "nginx:latest",
    ports: [
      { publicPort: 80, privatePort: 80, type: "tcp" },
      { publicPort: 443, privatePort: 443, type: "tcp" },
    ],
    createdLabel: "5 天前",
  },
  {
    id: "b1a7f0c33e6d",
    name: "postgres-db",
    state: "running",
    image: "postgres:16-alpine",
    ports: [{ publicPort: 5432, privatePort: 5432, type: "tcp" }],
    createdLabel: "1 周前",
  },
  {
    id: "f4d9e2b8c1a0",
    name: "redis-cache",
    state: "running",
    image: "redis:alpine",
    ports: [{ publicPort: 6379, privatePort: 6379, type: "tcp" }],
    createdLabel: "3 天前",
  },
  {
    id: "e7c0a9d6b2f4",
    name: "mysql-legacy",
    state: "exited",
    image: "mysql:8.0",
    ports: [],
    createdLabel: "2 周前",
  },
  {
    id: "d2b6f8e1c704",
    name: "grafana",
    state: "exited",
    image: "grafana/grafana:latest",
    ports: [{ publicPort: 3000, privatePort: 3000, type: "tcp" }],
    createdLabel: "1 个月前",
  },
];
