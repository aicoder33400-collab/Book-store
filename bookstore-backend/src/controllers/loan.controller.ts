import { Request, Response } from 'express';
import { LoanService } from '../services/loan.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const loanService = new LoanService();

export class LoanController {
  borrowBook = catchAsync(async (req: Request, res: Response) => {
    const { userId, bookId, dueDate } = req.body;
    
    const loan = await loanService.borrowBook(userId, bookId, new Date(dueDate));

    res.status(201).json(
      ApiResponse.success(loan, 'Book borrowed successfully')
    );
  });

  returnBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const loan = await loanService.returnBook(id);

    res.status(200).json(
      ApiResponse.success(loan, 'Book returned successfully')
    );
  });

  getAllLoans = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, userId, bookId, status } = req.query;
    
    const result = await loanService.getAllLoans({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      userId: userId as string,
      bookId: bookId as string,
      status: status as string,
    });

    // Utiliser ApiResponse.successWithPagination
    res.status(200).json(
      ApiResponse.successWithPagination(
        result.data,
        result.pagination,
        'Loans retrieved successfully'
      )
    );
  });

  getLoanById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const loan = await loanService.getLoanById(id);

    res.status(200).json(
      ApiResponse.success(loan, 'Loan retrieved successfully')
    );
  });
}