export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return {
      status: 'success',
      message: message || 'Operation successful',
      data,
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ) {
    return {
      status: 'success',
      message: message || 'Operation successful',
      data,
      pagination,
    };
  }

  static successWithSummary<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    summary: any,
    message?: string
  ) {
    return {
      status: 'success',
      message: message || 'Operation successful',
      data,
      pagination,
      summary,
    };
  }

  static error(message: string, statusCode: number = 400) {
    return {
      status: 'error',
      message,
      statusCode,
    };
  }
}