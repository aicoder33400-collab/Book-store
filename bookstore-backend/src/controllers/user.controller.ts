import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const userService = new UserService();

export class UserController {
  getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await userService.getAllUsers(page, limit);

    // Utiliser ApiResponse.successWithPagination
    res.status(200).json(
      ApiResponse.successWithPagination(
        result.data,
        result.pagination,
        'Users retrieved successfully'
      )
    );
  });

  getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json(
      ApiResponse.success(user, 'User retrieved successfully')
    );
  });

  createUser = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);

    res.status(201).json(
      ApiResponse.success(user, 'User created successfully')
    );
  });

  updateUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);

    res.status(200).json(
      ApiResponse.success(user, 'User updated successfully')
    );
  });

  deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await userService.deleteUser(id);

    res.status(200).json(
      ApiResponse.success(null, 'User deleted successfully')
    );
  });
}