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

  // 🔥 Utilisateur demande le retour
  requestReturn = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    // 🔥 Utiliser (req as any) pour accéder à user.id
    const userId = (req as any).user.id;

    const loan = await loanService.requestReturn(id, userId);

    res.status(200).json(
      ApiResponse.success(loan, 'Return requested successfully')
    );
  });

  // 🔥 Admin confirme le retour
  confirmReturn = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const loan = await loanService.confirmReturn(id);

    res.status(200).json(
      ApiResponse.success(loan, 'Return confirmed successfully')
    );
  });

  // ⚠️ Ancienne méthode returnBook (gardée pour compatibilité, mais plus utilisée)
  returnBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const loan = await loanService.returnBook(id);

    res.status(200).json(
      ApiResponse.success(loan, 'Book returned successfully')
    );
  });

  getMyLoans = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await loanService.getAllLoans({
      userId,
      limit: 100,
    });

    res.status(200).json(
      ApiResponse.successWithPagination(
        result.data,
        result.pagination,
        'Your loans retrieved successfully'
      )
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

  approveRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const loan = await loanService.approveRequest(id);
    res.status(200).json(
      ApiResponse.success(loan, 'Loan request approved')
    );
  });

  rejectRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const loan = await loanService.rejectRequest(id);
    res.status(200).json(
      ApiResponse.success(loan, 'Loan request rejected')
    );
  });

  handOverBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const loan = await loanService.handOverBook(id);
    res.status(200).json(
      ApiResponse.success(loan, 'Book handed over to user')
    );
  });

  deleteLoan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await loanService.deleteLoan(id);
    res.status(200).json(
      ApiResponse.success(null, 'Loan deleted successfully')
    );
  });

    // 🔥 Utilisateur choisit un créneau de retrait
  setPickupSlot = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { pickupDate, pickupPrayer } = req.body;

    const loan = await loanService.setPickupSlot(
      id,
      userId,
      new Date(pickupDate),
      pickupPrayer
    );

    res.status(200).json(
      ApiResponse.success(loan, 'Créneau de retrait enregistré')
    );
  });
  
}
