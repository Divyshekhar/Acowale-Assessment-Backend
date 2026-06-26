import { createServer } from "node:http";
import { env } from "./config/env";
import { app } from "./app";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server started");
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutting down server");

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server stopped");
    process.exit(0);
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
