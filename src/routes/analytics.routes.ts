import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/async-handler";

export const analyticsRouter = Router();

analyticsRouter.get("/", authenticate, asyncHandler(analyticsController.getDashboardAnalytics));
