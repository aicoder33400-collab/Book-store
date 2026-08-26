import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const prisma = new PrismaClient();

export class AdminController {
  // Dashboard
  static getDashboard = catchAsync(async (_req: Request, res: Response) => {
    const [
      totalBooks,
      totalUsers,
      totalLoans,
      activeLoans,
      requestedLoans,
      approvedLoans,
      overdueLoans,
      returnRequests
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'BORROWED' } }),
      prisma.loan.count({ where: { status: 'REQUESTED' } }),
      prisma.loan.count({ where: { status: 'APPROVED' } }),
      prisma.loan.count({ where: { status: 'LATE' } }),
      prisma.loan.count({ where: { status: 'RETURN_REQUESTED' } }),
    ]);

    // 🔥 Récupérer les demandes en attente (emprunts + retours)
    // Correction: utiliser copy.include.book au lieu de book directement
    const pendingRequests = await prisma.loan.findMany({
      where: { 
        OR: [
          { status: 'REQUESTED' },
          { status: 'RETURN_REQUESTED' }
        ]
      },
      include: {
        user: { 
          select: { 
            id: true,
            name: true, 
            email: true 
          } 
        },
        copy: {
          include: {
            book: { 
              select: { 
                id: true,
                title: true, 
                author: true 
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Transformer les données pour avoir book à la racine (comme dans votre ancien code)
    const transformedPendingRequests = pendingRequests.map(loan => ({
      ...loan,
      book: loan.copy.book, // Ajouter book à la racine
    }));

    const stats = {
      totalBooks,
      totalUsers,
      totalLoans,
      activeLoans,
      requestedLoans,
      approvedLoans,
      overdueLoans,
      returnRequests,
      pendingRequests: transformedPendingRequests,
    };

    res.status(200).json(
      ApiResponse.success(stats, 'Dashboard stats retrieved successfully')
    );
  });

  // 🔥 Notifications
  static getNotifications = catchAsync(async (_req: Request, res: Response) => {
    // Correction: utiliser copy.include.book au lieu de book directement
    const pendingLoans = await prisma.loan.findMany({
      where: { 
        OR: [
          { status: 'REQUESTED' },
          { status: 'RETURN_REQUESTED' }
        ]
      },
      include: {
        user: { 
          select: { 
            id: true,
            name: true, 
            email: true 
          } 
        },
        copy: {
          include: {
            book: { 
              select: { 
                id: true,
                title: true, 
                author: true 
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const notifications = pendingLoans.map((loan) => {
      const isReturnRequest = loan.status === 'RETURN_REQUESTED';
      return {
        id: loan.id,
        type: isReturnRequest ? 'return_request' : 'loan_request',
        message: isReturnRequest
          ? `📩 ${loan.user.name} souhaite retourner "${loan.copy.book.title}"`
          : `📚 ${loan.user.name} a demandé l'emprunt de "${loan.copy.book.title}"`,
        userId: loan.userId,
        userName: loan.user.name,
        bookTitle: loan.copy.book.title,
        createdAt: loan.createdAt.toISOString(),
        read: false,
      };
    });

    res.status(200).json(
      ApiResponse.success(notifications, 'Notifications retrieved successfully')
    );
  });

  static markNotificationRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Ici vous pourriez implémenter la logique pour marquer comme lu
    // par exemple, créer un modèle Notification ou mettre à jour un champ
    
    res.status(200).json(
      ApiResponse.success({ id, read: true }, 'Notification marquée comme lue')
    );
  });
}