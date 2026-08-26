import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

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

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    // Filtrer les livres disponibles si demandé
    let filteredBooks = books;
    if (params.availableOnly) {
      filteredBooks = books.filter(book => book.copies.length > 0);
    }

    // Transformer les données pour ajouter availableQuantity
    const transformedBooks = filteredBooks.map(book => ({
      ...book,
      availableQuantity: book.copies.length,
      totalQuantity: book.totalCopies,
    }));

    return {
      data: transformedBooks,
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
      include: {
        copies: true,
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const availableCopies = book.copies?.filter(c => c.status === 'AVAILABLE') || [];
    
    return {
      ...book,
      availableQuantity: availableCopies.length,
    };
  }

  async createBook(data: {
    title: string;
    author: string;
    isbn: string;
    description?: string;
    totalCopies: number;
    genre?: string;
    language?: string;
    isForRent?: boolean;
  }) {
    const existingBook = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });

    if (existingBook) {
      throw new AppError('Book with this ISBN already exists', 400);
    }

    // Créer le livre
    const book = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        description: data.description,
        totalCopies: data.totalCopies || 1,
        isForRent: data.isForRent ?? true,
        genre: data.genre as any || 'AUTRE',
        language: data.language as any || 'FRANCAIS',
      },
    });

    // Créer les copies
    const copies = [];
    for (let i = 1; i <= (data.totalCopies || 1); i++) {
      copies.push({
        bookId: book.id,
        copyNumber: i,
        status: 'AVAILABLE',
      });
    }
    
    await prisma.copy.createMany({
      data: copies,
    });

    return {
      ...book,
      availableQuantity: data.totalCopies || 1,
    };
  }

  async updateBook(id: string, data: {
    title?: string;
    author?: string;
    description?: string;
    totalCopies?: number;
    genre?: string;
    language?: string;
    isForRent?: boolean;
  }) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: true,
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const updateData: any = { ...data };
    
    // Si totalCopies est mis à jour
    if (data.totalCopies !== undefined) {
      const currentCopies = book.copies.length;
      const newTotal = data.totalCopies;
      
      if (newTotal > currentCopies) {
        // Ajouter des copies
        const copies = [];
        for (let i = currentCopies + 1; i <= newTotal; i++) {
          copies.push({
            bookId: id,
            copyNumber: i,
            status: 'AVAILABLE',
          });
        }
        await prisma.copy.createMany({ data: copies });
      } else if (newTotal < currentCopies) {
        // Vérifier que les copies à supprimer ne sont pas empruntées
        const borrowedCopies = book.copies.filter(c => c.status !== 'AVAILABLE');
        const copiesToRemove = currentCopies - newTotal;
        
        if (borrowedCopies.length > copiesToRemove) {
          throw new AppError('Cannot remove copies that are currently borrowed', 400);
        }
        
        // Supprimer les dernières copies
        const copiesToDelete = await prisma.copy.findMany({
          where: { bookId: id },
          orderBy: { copyNumber: 'desc' },
          take: copiesToRemove,
        });
        
        for (const copy of copiesToDelete) {
          await prisma.copy.delete({ where: { id: copy.id } });
        }
      }
    }

    return prisma.book.update({
      where: { id },
      data: {
        title: data.title,
        author: data.author,
        description: data.description,
        totalCopies: data.totalCopies,
        genre: data.genre as any,
        language: data.language as any,
        isForRent: data.isForRent,
      },
    });
  }

  async deleteBook(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            loans: {
              where: { 
                status: { in: ['BORROWED', 'LATE', 'REQUESTED', 'APPROVED'] } 
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    // Vérifier s'il y a des emprunts actifs
    const hasActiveLoans = book.copies.some(copy => copy.loans.length > 0);
    if (hasActiveLoans) {
      throw new AppError('Cannot delete book with active loans', 400);
    }

    // Supprimer d'abord toutes les copies (cascade devrait le faire, mais on le fait manuellement)
    await prisma.copy.deleteMany({
      where: { bookId: id },
    });

    return prisma.book.delete({
      where: { id },
    });
  }

  async checkAvailability(id: string): Promise<boolean> {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          where: { status: 'AVAILABLE' },
        },
      },
    });

    return book ? book.copies.length > 0 : false;
  }

  async updateStock(id: string, quantity: number, operation: 'decrease' | 'increase') {
    // Cette méthode est adaptée car nous utilisons des copies
    // On va trouver une copie disponible et la marquer comme empruntée ou disponible
    if (operation === 'decrease') {
      const copy = await prisma.copy.findFirst({
        where: {
          bookId: id,
          status: 'AVAILABLE',
        },
      });
      
      if (!copy) {
        throw new AppError('No available copy to borrow', 400);
      }
      
      return prisma.copy.update({
        where: { id: copy.id },
        data: { status: 'BORROWED' },
      });
    } else {
      // increase = retourner une copie
      const copy = await prisma.copy.findFirst({
        where: {
          bookId: id,
          status: 'BORROWED',
        },
      });
      
      if (!copy) {
        throw new AppError('No borrowed copy to return', 400);
      }
      
      return prisma.copy.update({
        where: { id: copy.id },
        data: { status: 'AVAILABLE' },
      });
    }
  }
}