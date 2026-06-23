import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
  async getDashboardStats() {
    const [
      totalBooks,
      totalUsers,
      activeLoans,
      requestedLoans,
      approvedLoans,
      lateLoans,
      totalRevenue,
      recentSales,
    ] = await Promise.all([
      // Total books
      prisma.book.count(),
      
      // Total users
      prisma.user.count(),
      
      // Active loans (BORROWED + LATE)
      prisma.loan.count({
        where: { status: { in: ['BORROWED', 'LATE'] } },
      }),
      
      // Pending requests
      prisma.loan.count({
        where: { status: 'REQUESTED' },
      }),
      
      // Approved awaiting pickup
      prisma.loan.count({
        where: { status: 'APPROVED' },
      }),
      
      // Late returns
      prisma.loan.count({
        where: { status: 'LATE' },
      }),
      
      // Total revenue
      prisma.sale.aggregate({
        _sum: { totalPrice: true },
      }),
      
      // Recent 5 sales with book info
      prisma.sale.findMany({
        take: 5,
        orderBy: { soldAt: 'desc' },
        include: {
          book: { select: { title: true } },
        },
      }),
    ]);

    return {
      totalBooks,
      totalUsers,
      activeLoans,
      requestedLoans,
      approvedLoans,
      lateLoans,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      recentSales,
    };
  }
}