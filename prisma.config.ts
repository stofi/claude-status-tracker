import { defineConfig } from "prisma/config";
import path from "path";
import os from "os";

const dbPath = path.join(os.homedir(), ".claude", "claude-status.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${dbPath}`,
  },
});
