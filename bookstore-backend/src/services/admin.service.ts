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
      
      
    ]);

    return {
      totalBooks,
      totalUsers,
      activeLoans,
      requestedLoans,
      approvedLoans,
      lateLoans,
    };
  }
}