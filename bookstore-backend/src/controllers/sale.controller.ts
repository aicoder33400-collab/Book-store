import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const saleService = new SaleService();

export class SaleController {
  createSale = catchAsync(async (req: Request, res: Response) => {
    const { bookId, quantity, totalPrice } = req.body;
    
    const sale = await saleService.createSale(bookId, quantity, totalPrice);

    res.status(201).json(
      ApiResponse.success(sale, 'Sale created successfully')
    );
  });

  getAllSales = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, bookId, startDate, endDate } = req.query;
    
    const result = await saleService.getAllSales({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      bookId: bookId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json(
      ApiResponse.successWithSummary(
        result.data,
        result.pagination,
        result.summary,
        'Sales retrieved successfully'
      )
    );
  });

  getSaleById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sale = await saleService.getSaleById(id);

    res.status(200).json(
      ApiResponse.success(sale, 'Sale retrieved successfully')
    );
  });

  getSalesStats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await saleService.getSalesStats();

    res.status(200).json(
      ApiResponse.success(stats, 'Statistics retrieved successfully')
    );
  });
}