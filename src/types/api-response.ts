export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type PaginatedApiSuccessResponse<T> = ApiSuccessResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
