import { PrismaClient, User, UserRole, LoanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    if (!user.password) {
      throw new AppError(
        'Ce compte utilise Google Connect. Veuillez vous connecter avec Google.',
        401
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    if (!user.emailVerified) {
      throw new AppError('Veuillez vérifier votre email avant de vous connecter', 401);
    }

    const token = this.generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async register(name: string, email: string, password: string, phone?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'USER',
        emailVerified: false,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    if (!user.password) {
      throw new AppError(
        'Ce compte utilise Google Connect. Vous ne pouvez pas changer de mot de passe.',
        400
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new AppError('Mot de passe actuel incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour avec succès' };
  }

  async verifyEmail(email: string, code: string) {
    // À implémenter
  }

  async forgotPassword(email: string) {
    // À implémenter
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    // À implémenter
  }

  async loginWithGoogle(googleToken: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id_token=${googleToken}`,
      });

      if (!response.ok) {
        throw new AppError('Token Google invalide', 401);
      }

      const googleUser = await response.json() as {
        sub: string;
        name: string;
        given_name: string;
        family_name: string;
        email: string;
        email_verified: boolean;
        picture: string;
      };

      if (!googleUser.email_verified) {
        throw new AppError('Email Google non vérifié', 400);
      }

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleUser.sub },
            { email: googleUser.email }
          ]
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`,
            email: googleUser.email,
            googleId: googleUser.sub,
            avatar: googleUser.picture || '',
            authProvider: 'google',
            emailVerified: true,
            role: 'USER',
          }
        });
      } else if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            avatar: googleUser.picture || '',
            authProvider: 'google',
            emailVerified: true,
          }
        });
      }

      const token = this.generateToken(user);

      const { password: _, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
      };

    } catch (error) {
      console.error('❌ Erreur loginWithGoogle:', error);
      throw error;
    }
  }

  // ============================================
  // 🔥 Générer un token JWT (CORRIGÉ)
  // ============================================
  private generateToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    const secret = process.env.JWT_SECRET || 'secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    // 🔥 Correction : Typer explicitement les options
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }
}

export default AuthService;
