import type { FeedbackStatus } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

type DailyFeedbackCount = {
  date: string;
  count: number;
};

export const analyticsService = {
  async getDashboardAnalytics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalFeedback,
      categoryDistribution,
      statusDistribution,
      recentFeedback,
      lastSevenDaysFeedback,
      pendingFeedback,
      resolvedFeedback,
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({
        by: ["category"],
        _count: {
          _all: true,
        },
      }),
      prisma.feedback.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      prisma.feedback.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.feedback.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      countByStatus("PENDING"),
      countByStatus("RESOLVED"),
    ]);

    return {
      totalFeedback,
      categoryDistribution: categoryDistribution.map((item) => ({
        category: item.category,
        count: item._count._all,
      })),
      statusDistribution: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      recentFeedback,
      feedbackSubmittedLastSevenDays: buildDailyCounts(lastSevenDaysFeedback.map((item) => item.createdAt)),
      pendingFeedback,
      resolvedFeedback,
    };
  },
};

const countByStatus = (status: FeedbackStatus): Promise<number> =>
  prisma.feedback.count({
    where: { status },
  });

const buildDailyCounts = (dates: Date[]): DailyFeedbackCount[] => {
  const counts = new Map<string, number>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = toDateKey(date);
    counts.set(key, 0);
  }

  for (const date of dates) {
    const key = toDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);
