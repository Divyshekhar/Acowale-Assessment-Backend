import { z } from "zod";
import { FEEDBACK_SORT_FIELDS } from "../constants/feedback";

export const feedbackCategorySchema = z.enum(["PRODUCT", "BUG", "FEATURE_REQUEST", "SUPPORT", "OTHER"]);
export const feedbackStatusSchema = z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"]);

export const createFeedbackBodySchema = z.object({
  category: feedbackCategorySchema,
  comment: z.string().trim().min(1, "Comment is required").max(5_000, "Comment is too long"),
  email: z.email().trim().toLowerCase().optional(),
});

export const feedbackIdParamsSchema = z.object({
  id: z.string().min(1, "Feedback id is required"),
});

export const listFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().min(1).optional(),
  category: feedbackCategorySchema.optional(),
  status: feedbackStatusSchema.optional(),
  sortBy: z.enum(FEEDBACK_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateFeedbackStatusBodySchema = z.object({
  status: feedbackStatusSchema,
});

export type CreateFeedbackBody = z.infer<typeof createFeedbackBodySchema>;
export type FeedbackIdParams = z.infer<typeof feedbackIdParamsSchema>;
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;
export type UpdateFeedbackStatusBody = z.infer<typeof updateFeedbackStatusBodySchema>;
