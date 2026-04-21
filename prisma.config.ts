import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

type ProcessWithLoadEnvFile = typeof process & {
  loadEnvFile?: (path?: string) => void;
};

function loadLocalEnvFile(path: string) {
  const absolutePath = resolve(path);

  if (!existsSync(absolutePath)) {
    return;
  }

  const loadEnvFile = (process as ProcessWithLoadEnvFile).loadEnvFile;

  if (typeof loadEnvFile === "function") {
    loadEnvFile(absolutePath);
  }
}

loadLocalEnvFile(".env");
loadLocalEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
