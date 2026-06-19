import { Request, Response } from 'express';
import { BookService } from '../services/book.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const bookService = new BookService();

export class BookController {
  getAllBooks = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, search, availableOnly } = req.query;
    
    const result = await bookService.getAllBooks({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      availableOnly: availableOnly === 'true',
    });

    res.status(200).json(
    ApiResponse.successWithPagination(
      result.data,
      result.pagination,
      'Books retrieved successfully'
    )
    );
  });

  getBookById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const book = await bookService.getBookById(id);

    res.status(200).json(
      ApiResponse.success(book, 'Book retrieved successfully')
    );
  });

  createBook = catchAsync(async (req: Request, res: Response) => {
    const book = await bookService.createBook(req.body);

    res.status(201).json(
      ApiResponse.success(book, 'Book created successfully')
    );
  });

  updateBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const book = await bookService.updateBook(id, req.body);

    res.status(200).json(
      ApiResponse.success(book, 'Book updated successfully')
    );
  });

  deleteBook = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await bookService.deleteBook(id);

    res.status(200).json(
      ApiResponse.success(null, 'Book deleted successfully')
    );
  });
}