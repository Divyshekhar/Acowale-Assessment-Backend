import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { requestLogger } from "./middlewares/request-logger";

type CreateAppOptions = {
  enableRequestLogger?: boolean;
};

export const createApp = (options: CreateAppOptions = {}) => {
  const expressApp = express();
  const enableRequestLogger = options.enableRequestLogger ?? true;

  if (enableRequestLogger) {
    expressApp.use(requestLogger);
  }

  expressApp.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  expressApp.use(express.json({ limit: "1mb" }));
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(cookieParser(env.COOKIE_SECRET));

  expressApp.get("/health", (_req, res) => {
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
    });
  });

  expressApp.use("/api/v1", apiRouter);

  expressApp.use(notFoundHandler);
  expressApp.use(errorHandler);

  return expressApp;
};

export const app = createApp();
