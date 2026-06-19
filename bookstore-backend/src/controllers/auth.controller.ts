import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json(
      ApiResponse.success(result, 'Login successful')
    );
  });
}