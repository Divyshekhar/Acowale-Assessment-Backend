import type { Response } from "express";
import type { PaginationMeta } from "../types/pagination";

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  pagination: PaginationMeta,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};
