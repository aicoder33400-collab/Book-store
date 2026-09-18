import { PrismaClient, LoanStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export class LoanService {
  // Emprunter un livre
  async borrowBook(userId: string, bookId: string, dueDate: Date) {
    // 1. Vérifier que le livre existe
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          where: { status: 'AVAILABLE' },
        },
      },
    });

    if (!book) {
      throw new AppError('Livre non trouvé', 404);
    }

    // 2. Vérifier la disponibilité (copies disponibles)
    const availableCopies = book.copies?.filter(c => c.status === 'AVAILABLE') || [];
    if (availableCopies.length <= 0) {
      throw new AppError('Livre non disponible', 400);
    }

    // 3. Vérifier si l'utilisateur a déjà ce livre en cours
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId,
        copy: {
          bookId: bookId,
        },
        status: {
          in: ['REQUESTED', 'APPROVED', 'BORROWED', 'LATE'],
        },
      },
    });

    if (existingLoan) {
      throw new AppError('Vous avez déjà ce livre en cours (demande en attente, approuvée ou emprunté)', 400);
    }

    // 4. Créer l'emprunt avec la première copie disponible
    const loan = await prisma.loan.create({
      data: {
        userId,
        copyId: availableCopies[0].id,
        dueDate,
        status: 'REQUESTED',
      },
      include: {
        user: true,
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    // Mettre à jour le statut de la copie
    await prisma.copy.update({
      where: { id: availableCopies[0].id },
      data: { status: 'BORROWED' },
    });

    return {
      ...loan,
      bookId: loan.copy.bookId,
      book: loan.copy.book,
    };
  }

  // L'utilisateur demande le retour
  async requestReturn(loanId: string, userId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
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
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

  // L'admin confirme le retour
  async confirmReturn(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
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
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    // Remettre la copie disponible
    await prisma.copy.update({
      where: { id: loan.copyId },
      data: { status: 'AVAILABLE' },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

  // Retourner un livre (ancienne méthode)
  async returnBook(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
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
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    // Remettre la copie disponible
    await prisma.copy.update({
      where: { id: loan.copyId },
      data: { status: 'AVAILABLE' },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

  async getAllLoans(filters?: any) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.bookId) {
      where.copy = {
        bookId: filters.bookId,
      };
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
          copy: {
            include: {
              // 🔥 isbn retiré
              book: {
                select: { id: true, title: true, author: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);

    // Transformer les données pour avoir bookId et book à la racine
    const transformedData = data.map(loan => ({
      ...loan,
      bookId: loan.copy.bookId,
      book: loan.copy.book,
    }));

    return {
      data: transformedData,
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
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    return {
      ...loan,
      bookId: loan.copy.bookId,
      book: loan.copy.book,
    };
  }

  async approveRequest(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'REQUESTED') {
      throw new AppError('Seulement les demandes en attente peuvent être approuvées', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'APPROVED' },
      include: {
        user: true,
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

  async rejectRequest(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
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
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    // Remettre la copie disponible
    await prisma.copy.update({
      where: { id: loan.copyId },
      data: { status: 'AVAILABLE' },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

    // 🔥 Utilisateur choisit un créneau de retrait (rendez-vous)
  async setPickupSlot(loanId: string, userId: string, pickupDate: Date, pickupPrayer: 'DOHR' | 'ASR' | 'MAGHREB') {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Emprunt introuvable', 404);
    }

    // Vérifier que l'emprunt appartient bien à l'utilisateur
    if (loan.userId !== userId) {
      throw new AppError('Non autorisé', 403);
    }

    // Vérifier que le statut permet de choisir un créneau
    if (loan.status !== 'APPROVED') {
      throw new AppError('Vous ne pouvez choisir un créneau que pour un emprunt approuvé', 400);
    }

    // Vérifier que la date est dans le futur (aujourd'hui ou plus tard)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (pickupDate < now) {
      throw new AppError('La date choisie doit être dans le futur', 400);
    }

    // Vérifier que la date est dans les 7 prochains jours
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(23, 59, 59, 999);
    if (pickupDate > maxDate) {
      throw new AppError('La date doit être dans les 7 prochains jours', 400);
    }

    return await prisma.loan.update({
      where: { id: loanId },
      data: {
        pickupDate,
        pickupPrayer,
      },
      include: {
        user: true,
        copy: {
          include: {
            book: true,
          },
        },
      },
    });
  }
  
  async handOverBook(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    if (loan.status !== 'APPROVED') {
      throw new AppError('Seulement les prêts approuvés peuvent être remis', 400);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'BORROWED',
        borrowedAt: new Date(),
      },
      include: {
        user: true,
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    return {
      ...updatedLoan,
      bookId: updatedLoan.copy.bookId,
      book: updatedLoan.copy.book,
    };
  }

  async deleteLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: true,
      },
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404);
    }

    // Si l'emprunt est en cours, remettre la copie disponible
    if (loan.status === 'BORROWED' || loan.status === 'LATE' || loan.status === 'APPROVED') {
      await prisma.copy.update({
        where: { id: loan.copyId },
        data: { status: 'AVAILABLE' },
      });
    }

    await prisma.loan.delete({
      where: { id: loanId },
    });

    return { message: 'Emprunt supprimé' };
  }
}
