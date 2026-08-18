import { PrismaClient, LoanStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export class LoanService {
  // Emprunter un livre
  async borrowBook(userId: string, bookId: string, dueDate: Date) {
    // 1. Vérifier que le livre existe
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new AppError('Livre non trouvé', 404);
    }

    // 2. Vérifier la disponibilité
    if (book.availableQuantity <= 0) {
      throw new AppError('Livre non disponible', 400);
    }

    // 3. 🔥 Vérifier si l'utilisateur a déjà ce livre en cours
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId,
        bookId,
        status: {
          in: ['REQUESTED', 'APPROVED', 'BORROWED', 'LATE'],
        },
      },
    });

    if (existingLoan) {
      throw new AppError('Vous avez déjà ce livre en cours (demande en attente, approuvée ou emprunté)', 400);
    }

    // 4. Créer l'emprunt
    const loan = await prisma.loan.create({
      data: {
        userId,
        bookId,
        dueDate,
        status: 'REQUESTED',
      },
      include: {
        user: true,
        book: true,
      },
    });

    return loan;
  }

  // 🔥 L'utilisateur demande le retour
  async requestReturn(loanId: string, userId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.userId !== userId) {
      throw new AppError('Vous ne pouvez pas demander le retour de ce livre', 403);
    }

    if (loan.status !== 'BORROWED' && loan.status !== 'LATE') {
      throw new AppError('Ce livre n\'est pas emprunté', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'RETURN_REQUESTED' },
      include: {
        user: true,
        book: true,
      },
    });

    return updatedLoan;
  }

  // 🔥 L'admin confirme le retour
  async confirmReturn(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'RETURN_REQUESTED') {
      throw new AppError('Aucune demande de retour en attente', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
      },
      include: {
        user: true,
        book: true,
      },
    });

    // Augmenter la quantité disponible
    await prisma.book.update({
      where: { id: loan.bookId },
      data: { availableQuantity: { increment: 1 } },
    });

    return updatedLoan;
  }

  // Retourner un livre (ancienne méthode)
  async returnBook(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'BORROWED' && loan.status !== 'LATE') {
      throw new AppError('Ce livre n\'est pas emprunté', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
      },
      include: {
        user: true,
        book: true,
      },
    });

    await prisma.book.update({
      where: { id: loan.bookId },
      data: { availableQuantity: { increment: 1 } },
    });

    return updatedLoan;
  }

  async getAllLoans(filters?: any) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.bookId) {
      where.bookId = filters.bookId;
    }

    if (filters?.status) {
      where.status = filters.status as LoanStatus;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      data,
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
        user: true,
        book: true,
      },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    return loan;
  }

  async approveRequest(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'REQUESTED') {
      throw new AppError('Seulement les demandes en attente peuvent être approuvées', 400);
    }

    if (loan.book.availableQuantity <= 0) {
      throw new AppError('Livre non disponible', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'APPROVED' },
      include: {
        user: true,
        book: true,
      },
    });

    return updatedLoan;
  }

  async rejectRequest(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'REQUESTED') {
      throw new AppError('Seulement les demandes en attente peuvent être refusées', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REJECTED' },
      include: {
        user: true,
        book: true,
      },
    });

    return updatedLoan;
  }

  async handOverBook(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'APPROVED') {
      throw new AppError('Seulement les prêts approuvés peuvent être remis', 400);
    }

    if (loan.book.availableQuantity <= 0) {
      throw new AppError('Livre non disponible', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'BORROWED',
        borrowedAt: new Date(),
      },
      include: {
        user: true,
        book: true,
      },
    });

    // Réduire la quantité disponible
    await prisma.book.update({
      where: { id: loan.bookId },
      data: { availableQuantity: { decrement: 1 } },
    });

    return updatedLoan;
  }

  async deleteLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    await prisma.loan.delete({
      where: { id: loanId },
    });

    return { message: 'Emprunt supprimé' };
  }
}
