import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../config/env";

const createPrismaClient = (): PrismaClient => {
  if (env.DATABASE_URL.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: env.DATABASE_URL,
    });
  }

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
  });
};

export const prisma = createPrismaClient();
