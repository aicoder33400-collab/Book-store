import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const adminService = new AdminService();

export class AdminController {
  getDashboard = catchAsync(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(
      ApiResponse.success(stats, 'Dashboard stats retrieved successfully')
    );
  });
}