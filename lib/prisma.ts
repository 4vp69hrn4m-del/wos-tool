import { PrismaClient } from "@prisma/client";

// Next.jsの開発モードでの再接続過多を防ぐためのおまじない
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
