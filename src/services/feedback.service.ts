import type { FeedbackCategory, FeedbackStatus, Prisma } from "../../generated/prisma/client";
import { FEEDBACK_STATUS_TRANSITIONS } from "../constants/feedback";
import { HttpStatus } from "../constants/http-status";
import { prisma } from "../lib/prisma";
import type { PaginationMeta } from "../types/pagination";
import { ApiError } from "../utils/api-error";

type CreateFeedbackInput = {
  category: FeedbackCategory;
  comment: string;
  email?: string;
};

type ListFeedbackInput = {
  page: number;
  limit: number;
  search?: string;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  sortBy: "createdAt" | "updatedAt" | "category" | "status";
  sortOrder: "asc" | "desc";
};

type ListFeedbackResult = {
  data: Awaited<ReturnType<typeof prisma.feedback.findMany>>;
  pagination: PaginationMeta;
};

export const feedbackService = {
  async create(input: CreateFeedbackInput) {
    return prisma.feedback.create({
      data: input,
    });
  },

  async list(input: ListFeedbackInput): Promise<ListFeedbackResult> {
    const where = buildFeedbackWhere(input);
    const skip = (input.page - 1) * input.limit;

    const [data, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  },

  async getById(id: string) {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new ApiError(HttpStatus.NOT_FOUND, "Feedback not found");
    }

    return feedback;
  },

  async updateStatus(id: string, nextStatus: FeedbackStatus) {
    const feedback = await this.getById(id);
    const allowedNextStatuses = FEEDBACK_STATUS_TRANSITIONS[feedback.status];

    if (!allowedNextStatuses.includes(nextStatus as never)) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        `Cannot transition feedback from ${feedback.status} to ${nextStatus}`,
      );
    }

    return prisma.feedback.update({
      where: { id },
      data: { status: nextStatus },
    });
  },

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await prisma.feedback.delete({
      where: { id },
    });
  },
};

const buildFeedbackWhere = (input: ListFeedbackInput): Prisma.FeedbackWhereInput => {
  const where: Prisma.FeedbackWhereInput = {};

  if (input.category) {
    where.category = input.category;
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.search) {
    where.OR = [
      {
        comment: {
          contains: input.search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: input.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
};
