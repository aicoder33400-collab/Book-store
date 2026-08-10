import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface GetBooksParams {
  page?: number;
  limit?: number;
  search?: string;
  availableOnly?: boolean;
}

export class BookService {
  async getAllBooks(params: GetBooksParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, params.limit || 10);
  const skip = (page - 1) * limit;

  const where: any = {};

  // Search by title or author
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { author: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  // Filter available books only
  if (params.availableOnly) {
    where.availableQuantity = { gt: 0 };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data: books,  // Retourne toujours les objets complets
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return book;
  }

  async createBook(data: {
    title: string;
    author: string;
    isbn: string;
    description?: string;
    totalQuantity: number;
    isForSale?: boolean;
    isForRent?: boolean;
  }) {
    const existingBook = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });

    if (existingBook) {
      throw new AppError('Book with this ISBN already exists', 400);
    }

    return prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        description: data.description,
        totalQuantity: data.totalQuantity,
        availableQuantity: data.totalQuantity,
        isForSale: data.isForSale ?? true,
        isForRent: data.isForRent ?? true,
      },
    });
  }

  async updateBook(id: string, data: {
    title?: string;
    author?: string;
    description?: string;
    totalQuantity?: number;
    isForSale?: boolean;
    isForRent?: boolean;
  }) {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const updateData: any = { ...data };
    
    // If totalQuantity is being updated, adjust availableQuantity
    if (data.totalQuantity !== undefined) {
      const quantityDifference = data.totalQuantity - book.totalQuantity;
      updateData.availableQuantity = book.availableQuantity + quantityDifference;
      
      if (updateData.availableQuantity < 0) {
        throw new AppError('Cannot reduce total quantity below borrowed books count', 400);
      }
    }

    return prisma.book.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBook(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        loans: {
          where: { status: { in: ['BORROWED', 'LATE'] } },
        },
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    if (book.loans.length > 0) {
      throw new AppError('Cannot delete book with active loans', 400);
    }

    return prisma.book.delete({
      where: { id },
    });
  }

  async checkAvailability(id: string): Promise<boolean> {
    const book = await prisma.book.findUnique({
      where: { id },
      select: { availableQuantity: true },
    });

    return book ? book.availableQuantity > 0 : false;
  }

  async updateStock(id: string, quantity: number, operation: 'decrease' | 'increase') {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const newQuantity = operation === 'decrease' 
      ? book.availableQuantity - quantity
      : book.availableQuantity + quantity;

    if (newQuantity < 0) {
      throw new AppError('Insufficient stock', 400);
    }

    return prisma.book.update({
      where: { id },
      data: { availableQuantity: newQuantity },
    });
  }
}