import type { Request, Response } from "express";
import { HttpStatus } from "../constants/http-status";
import { analyticsService } from "../services/analytics.service";
import { sendSuccess } from "../utils/response";

export const analyticsController = {
  async getDashboardAnalytics(_req: Request, res: Response): Promise<void> {
    const analytics = await analyticsService.getDashboardAnalytics();

    sendSuccess(res, HttpStatus.OK, "Analytics fetched successfully", analytics);
  },
};
