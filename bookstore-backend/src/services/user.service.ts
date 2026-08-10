import { PrismaClient, User } from '@prisma/client';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class UserService {
  // 🔥 Récupérer tous les utilisateurs avec les nouvelles infos
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
          phone: true,           // 🔥 AJOUTÉ
          role: true,
          authProvider: true,    // 🔥 AJOUTÉ
          avatar: true,          // 🔥 AJOUTÉ
          emailVerified: true,   // 🔥 AJOUTÉ
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,     // 🔥 NOUVEAU
          // On exclut les champs sensibles
          password: false,
          verificationCode: false,
          resetCode: false,
          resetCodeExpires: false,
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

  // 🔥 Récupérer un utilisateur par ID avec toutes les infos
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
        updatedAt: true,
        lastLoginAt: true,      // 🔥 NOUVEAU
        password: false,
        verificationCode: false,
        resetCode: false,
        resetCodeExpires: false,
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    return user;
  }

  // 🔥 Créer un utilisateur (admin)
  async createUser(data: any) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    // Hasher le mot de passe si fourni
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
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  // 🔥 Mettre à jour un utilisateur
  async updateUser(id: string, data: any) {
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };

    // Si un mot de passe est fourni, le hasher
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
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  // 🔥 Supprimer un utilisateur
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

  // 🔥 Mettre à jour la date de dernière connexion
  async updateLastLogin(id: string) {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
