import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

export class LoanService {
  async borrowBook(userId: string, bookId: string, dueDate: Date) {
    // Start a transaction
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. D'abord, décrémenter le stock avec une condition (opération atomique)
      const updatedBook = await tx.book.update({
        where: {
          id: bookId,
          availableQuantity: { gt: 0 }, // ← CRUCIAL : ne décrémente que si stock > 0
        },
        data: {
          availableQuantity: { decrement: 1 },
        },
      });

      if (!updatedBook) {
        throw new AppError('Book not available for borrowing (insufficient stock)', 400);
      }

      // 2. Vérifier si le livre est prêtable
      if (!updatedBook.isForRent) {
        // Restaurer le stock car on a décrémenté par erreur
        await tx.book.update({
          where: { id: bookId },
          data: { availableQuantity: { increment: 1 } },
        });
        throw new AppError('This book is for sale only, cannot be borrowed', 400);
      }

      // 3. Vérifier si l'utilisateur existe
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // Restaurer le stock
        await tx.book.update({
          where: { id: bookId },
          data: { availableQuantity: { increment: 1 } },
        });
        throw new AppError('User not found', 404);
      }

      // 4. Vérifier si l'utilisateur a déjà un emprunt actif
      const existingLoan = await tx.loan.findFirst({
        where: {
          userId,
          bookId,
          status: { in: ['BORROWED', 'LATE'] },
        },
      });

      if (existingLoan) {
        // Restaurer le stock
        await tx.book.update({
          where: { id: bookId },
          data: { availableQuantity: { increment: 1 } },
        });
        throw new AppError('You already have an active loan for this book', 400);
      }

      // 5. Créer l'emprunt
      const loan = await tx.loan.create({
        data: {
          userId,
          bookId,
          dueDate,
          status: 'BORROWED',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: { id: true, title: true, author: true, isbn: true },
          },
        },
      });

      return loan;
    });
  }

  // Le reste du code reste identique
  async returnBook(loanId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true },
      });

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      if (loan.status === 'RETURNED') {
        throw new AppError('Book has already been returned', 400);
      }

      const now = new Date();
      const isLate = now > loan.dueDate;

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          returnedAt: now,
          status: isLate ? 'LATE' : 'RETURNED',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: { id: true, title: true, author: true, isbn: true },
          },
        },
      });

      await tx.book.update({
        where: { id: loan.bookId },
        data: { availableQuantity: { increment: 1 } },
      });

      return updatedLoan;
    });
  }

  // getAllLoans, getLoanById, updateLateLoans restent identiques
  async getAllLoans(params: {
    page?: number;
    limit?: number;
    userId?: string;
    bookId?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, params.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.bookId) {
      where.bookId = params.bookId;
    }

    if (params.status && ['BORROWED', 'RETURNED', 'LATE'].includes(params.status)) {
      where.status = params.status;
    }

    await this.updateLateLoans();

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: { id: true, title: true, author: true, isbn: true },
          },
        },
        orderBy: { borrowedAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      data: loans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLoanById(id: string) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        book: true,
      },
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    return loan;
  }

  async updateLateLoans() {
    const now = new Date();
    
    await prisma.loan.updateMany({
      where: {
        dueDate: { lt: now },
        status: 'BORROWED',
      },
      data: {
        status: 'LATE',
      },
    });
  }
}