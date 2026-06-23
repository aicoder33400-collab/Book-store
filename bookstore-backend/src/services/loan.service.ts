import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

export class LoanService {
  async borrowBook(userId: string, bookId: string, dueDate: Date) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Check book exists and is for rent
      const book = await tx.book.findUnique({ where: { id: bookId } });

      if (!book) {
        throw new AppError('Book not found', 404);
      }

      if (!book.isForRent) {
        throw new AppError('This book is for sale only, cannot be borrowed', 400);
      }

      if (book.availableQuantity <= 0) {
        throw new AppError('Book not available (insufficient stock)', 400);
      }

      // 2. Check user exists
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // 3. Check no active request/loan for this book by this user
      const existingLoan = await tx.loan.findFirst({
        where: {
          userId,
          bookId,
          status: { in: ['REQUESTED', 'APPROVED', 'BORROWED', 'LATE'] },
        },
      });

      if (existingLoan) {
        throw new AppError('You already have an active request or loan for this book', 400);
      }

      // 4. Create the request (no stock decrement yet!)
      const loan = await tx.loan.create({
        data: {
          userId,
          bookId,
          dueDate,
          status: 'REQUESTED',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true, isbn: true } },
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

    if (params.status && ['REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURNED', 'LATE'].includes(params.status)) {
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

    async approveRequest(loanId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true },
      });

      if (!loan) throw new AppError('Loan not found', 404);
      if (loan.status !== 'REQUESTED') {
        throw new AppError('Only REQUESTED loans can be approved', 400);
      }
      if (loan.book.availableQuantity <= 0) {
        throw new AppError('Book no longer available', 400);
      }

      // Reserve the book (decrement available quantity)
      await tx.book.update({
        where: { id: loan.bookId },
        data: { availableQuantity: { decrement: 1 } },
      });

      return tx.loan.update({
        where: { id: loanId },
        data: { status: 'APPROVED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true, isbn: true } },
        },
      });
    });
  }

  async rejectRequest(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new AppError('Loan not found', 404);
    if (loan.status !== 'REQUESTED') {
      throw new AppError('Only REQUESTED loans can be rejected', 400);
    }

    return prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REJECTED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
    });
  }

  async handOverBook(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new AppError('Loan not found', 404);
    if (loan.status !== 'APPROVED') {
      throw new AppError('Only APPROVED loans can be handed over', 400);
    }

    return prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'BORROWED',
        borrowedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
    });
  }

  async deleteLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new AppError('Loan not found', 404);
    
    // If book was reserved (APPROVED) or borrowed (BORROWED/LATE), restore quantity
    if (['APPROVED', 'BORROWED', 'LATE'].includes(loan.status)) {
      await prisma.book.update({
        where: { id: loan.bookId },
        data: { availableQuantity: { increment: 1 } },
      });
    }
    
    await prisma.loan.delete({ where: { id: loanId } });
  }
}