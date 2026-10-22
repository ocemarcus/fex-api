import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "src/tests/**/*.spec.ts"],
    alias: {
      "@config": path.resolve(__dirname, "./src/config"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
    deps: {
      inline: ["supertest"],
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    sequence: {
      hooks: "list",
    },
    concurrent: false,
  },
});
