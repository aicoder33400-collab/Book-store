import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { ApiResponse } from '../utils/response';

const prisma = new PrismaClient();

export class AdminController {
  // Dashboard
  static getDashboard = catchAsync(async (_req: Request, res: Response) => {
    const [totalBooks, totalUsers, totalLoans, activeLoans, requestedLoans, approvedLoans, overdueLoans] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'BORROWED' } }),
      prisma.loan.count({ where: { status: 'REQUESTED' } }),
      prisma.loan.count({ where: { status: 'APPROVED' } }),
      prisma.loan.count({ where: { status: 'LATE' } }),
    ]);

    const stats = {
      totalBooks,
      totalUsers,
      totalLoans,
      activeLoans,
      requestedLoans,
      approvedLoans,
      overdueLoans,
    };

    res.status(200).json(
      ApiResponse.success(stats, 'Dashboard stats retrieved successfully')
    );
  });

  // 🔥 Notifications - Récupérer les demandes en attente
  static getNotifications = catchAsync(async (_req: Request, res: Response) => {
    // Récupérer les demandes en attente (REQUESTED)
    const pendingLoans = await prisma.loan.findMany({
      where: { status: 'REQUESTED' },
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, author: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Construire les notifications
    const notifications = pendingLoans.map((loan) => ({
      id: loan.id,
      type: 'loan_request',
      message: `📚 ${loan.user.name} a demandé l'emprunt de "${loan.book.title}"`,
      userId: loan.userId,
      userName: loan.user.name,
      bookTitle: loan.book.title,
      createdAt: loan.createdAt.toISOString(),
      read: false,
    }));

    res.status(200).json(
      ApiResponse.success(notifications, 'Notifications retrieved successfully')
    );
  });

  // Marquer une notification comme lue
  static markNotificationRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Dans un vrai système, on aurait une table Notification
    // Pour l'instant, on simule
    res.status(200).json(
      ApiResponse.success(null, 'Notification marquée comme lue')
    );
  });
}