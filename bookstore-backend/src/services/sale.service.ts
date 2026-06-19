import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

export class SaleService {
  async createSale(bookId: string, quantity: number, totalPrice: number) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. D'abord, décrémenter le stock avec condition (opération atomique)
      const updatedBook = await tx.book.update({
        where: {
          id: bookId,
          availableQuantity: { gte: quantity }, // ← Condition : stock >= quantité
        },
        data: {
          availableQuantity: { decrement: quantity },
        },
      });

      if (!updatedBook) {
        throw new AppError('Book not found or insufficient stock (insufficient stock)', 400);
      }

      // 2. Vérifier si le livre est vendable
      if (!updatedBook.isForSale) {
        // Restaurer le stock
        await tx.book.update({
          where: { id: bookId },
          data: { availableQuantity: { increment: quantity } },
        });
        throw new AppError('This book is for rent only, cannot be sold', 400);
      }

      // 3. Créer la vente
      const sale = await tx.sale.create({
        data: {
          bookId,
          quantity,
          totalPrice,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
              isForSale: true,
              isForRent: true,
            },
          },
        },
      });

      return sale;
    });
  }

  // Le reste du code reste identique
  async getAllSales(params: {
    page?: number;
    limit?: number;
    bookId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, params.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.bookId) {
      where.bookId = params.bookId;
    }

    if (params.startDate || params.endDate) {
      where.soldAt = {};
      if (params.startDate) {
        where.soldAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.soldAt.lte = params.endDate;
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
        },
        orderBy: { soldAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0);
    const totalItems = sales.reduce((sum: number, sale: any) => sum + sale.quantity, 0);

    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalRevenue,
        totalItems,
      },
    };
  }

  async getSaleById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        },
      },
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    return sale;
  }

  async getSalesStats() {
    const stats = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const totalSales = await tx.sale.count();
      
      const totalRevenue = await tx.sale.aggregate({
        _sum: {
          totalPrice: true,
        },
      });

      const totalItems = await tx.sale.aggregate({
        _sum: {
          quantity: true,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = await tx.sale.aggregate({
        where: {
          soldAt: {
            gte: today,
          },
        },
        _sum: {
          totalPrice: true,
        },
      });

      return {
        totalSales,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalItemsSold: totalItems._sum.quantity || 0,
        todayRevenue: todaySales._sum.totalPrice || 0,
      };
    });

    return stats;
  }
}