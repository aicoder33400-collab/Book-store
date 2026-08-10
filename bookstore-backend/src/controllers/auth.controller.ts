import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const authService = new AuthService();

export class AuthController {
  // ============================================
  // Connexion email/password
  // ============================================
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Connexion réussie',
      data: result,
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Inscription
  // ============================================
  register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, password, phone } = req.body;
    const user = await authService.register(name, email, password, phone);
    res.status(201).json({
      success: true,
      status: 201,
      message: 'Inscription réussie',
      data: user,
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Vérification email
  // ============================================
  verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    await authService.verifyEmail(email, code);
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Email vérifié avec succès',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Mot de passe oublié
  // ============================================
  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Email de réinitialisation envoyé',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Réinitialiser le mot de passe
  // ============================================
  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    await authService.resetPassword(email, code, newPassword);
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Mot de passe réinitialisé avec succès',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Changer le mot de passe (CORRIGÉ)
  // ============================================
  changePassword = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore - req.user est ajouté par le middleware AuthMiddleware
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Utilisateur non authentifié', 401);
    }
    
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Mot de passe changé avec succès',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Connexion avec Google
  // ============================================
  loginWithGoogle = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    if (!token) {
      throw new AppError('Token Google manquant', 400);
    }
    
    const result = await authService.loginWithGoogle(token);
    
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Connexion Google réussie',
      data: result,
      timestamp: new Date().toISOString(),
    });
  });
}
