// bookstore-backend/src/utils/ApiResponse.ts

export class ApiResponse {
  public success: boolean;
  public status: number;
  public message: string;
  public data?: any;
  public timestamp: string;

  constructor(status: number, message: string, data?: any) {
    this.success = status >= 200 && status < 300;
    this.status = status;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: this.success,
      status: this.status,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}