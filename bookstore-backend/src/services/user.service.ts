import { PrismaClient, User } from '@prisma/client';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class UserService {
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          authProvider: true,
          avatar: true,
          emailVerified: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          age: true,        // ✅ Gardé pour l'Admin
          commune: true,
          isProfileComplete: true,
          // ❌ lastLoginAt SUPPRIMÉ
          // ❌ verificationCode SUPPRIMÉ
          // ❌ resetCode SUPPRIMÉ
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
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

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        age: true,
        commune: true,
        isProfileComplete: true,
        // ❌ lastLoginAt SUPPRIMÉ
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    return user;
  }

  async createUser(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    let password = undefined;
    if (data.password) {
      password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: password,
        role: data.role || 'USER',
        authProvider: 'local',
        emailVerified: data.emailVerified || false,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        age: data.age || null,
        commune: data.commune || null,
        isProfileComplete: data.isProfileComplete || false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        age: true,
        commune: true,
        isProfileComplete: true,
      },
    });

    return user;
  }

  async updateUser(id: string, data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      commune: data.commune,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        age: true,
        commune: true,
        isProfileComplete: true,
      },
    });

    return user;
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }
}