import { Router } from "express";
import { analyticsRouter } from "./analytics.routes";
import { authRouter } from "./auth.routes";
import { feedbackRouter } from "./feedback.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/analytics", analyticsRouter);
