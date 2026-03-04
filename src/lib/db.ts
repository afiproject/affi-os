import { IS_DEMO } from "./demo-data";

// DEMO_MODE: Prisma を初期化しない（DB不要）
let prismaInstance: any = null;

if (!IS_DEMO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client");
    const g = globalThis as unknown as { prisma: any };
    prismaInstance = g.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") g.prisma = prismaInstance;
  } catch {
    console.warn("[SLOTY] PrismaClient not available.");
  }
}

export const prisma = prismaInstance;
