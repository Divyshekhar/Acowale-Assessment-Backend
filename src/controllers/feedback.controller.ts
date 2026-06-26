import type { Request, Response } from "express";
import { HttpStatus } from "../constants/http-status";
import { feedbackService } from "../services/feedback.service";
import type {
  CreateFeedbackBody,
  FeedbackIdParams,
  ListFeedbackQuery,
  UpdateFeedbackStatusBody,
} from "../validators/feedback.validator";
import { sendPaginatedSuccess, sendSuccess } from "../utils/response";

export const feedbackController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateFeedbackBody;
    const feedback = await feedbackService.create(body);

    sendSuccess(res, HttpStatus.CREATED, "Feedback submitted successfully", feedback);
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListFeedbackQuery;
    const result = await feedbackService.list(query);

    sendPaginatedSuccess(
      res,
      HttpStatus.OK,
      "Feedback fetched successfully",
      result.data,
      result.pagination,
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    const params = req.params as FeedbackIdParams;
    const feedback = await feedbackService.getById(params.id);

    sendSuccess(res, HttpStatus.OK, "Feedback fetched successfully", feedback);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const params = req.params as FeedbackIdParams;
    const body = req.body as UpdateFeedbackStatusBody;
    const feedback = await feedbackService.updateStatus(params.id, body.status);

    sendSuccess(res, HttpStatus.OK, "Feedback status updated successfully", feedback);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const params = req.params as FeedbackIdParams;
    await feedbackService.delete(params.id);

    sendSuccess(res, HttpStatus.OK, "Feedback deleted successfully", null);
  },
};
