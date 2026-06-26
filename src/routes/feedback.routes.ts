import { Router } from "express";
import { feedbackController } from "../controllers/feedback.controller";
import { authenticate } from "../middlewares/authenticate";
import { feedbackCreateRateLimiter } from "../middlewares/rate-limiters";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/async-handler";
import {
  createFeedbackBodySchema,
  feedbackIdParamsSchema,
  listFeedbackQuerySchema,
  updateFeedbackStatusBodySchema,
} from "../validators/feedback.validator";

export const feedbackRouter = Router();

feedbackRouter.post(
  "/",
  feedbackCreateRateLimiter,
  validate({ body: createFeedbackBodySchema }),
  asyncHandler(feedbackController.create),
);

feedbackRouter.use(authenticate);

feedbackRouter.get(
  "/",
  validate({ query: listFeedbackQuerySchema }),
  asyncHandler(feedbackController.list),
);
feedbackRouter.get(
  "/:id",
  validate({ params: feedbackIdParamsSchema }),
  asyncHandler(feedbackController.getById),
);
feedbackRouter.patch(
  "/:id/status",
  validate({ params: feedbackIdParamsSchema, body: updateFeedbackStatusBodySchema }),
  asyncHandler(feedbackController.updateStatus),
);
feedbackRouter.delete(
  "/:id",
  validate({ params: feedbackIdParamsSchema }),
  asyncHandler(feedbackController.delete),
);
