import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const authController = new AuthController();
const prisma = new PrismaClient();

// ============================================
// ROUTES EXISTANTES (Email/Password)
// ============================================

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', AuthMiddleware.protect, authController.changePassword);

// ============================================
// 🔥 ROUTE DE DÉVELOPPEMENT - Login sans Google
// ============================================
router.post('/dev-login', async (req, res) => {
  try {
    const { email, name, role } = req.body;
    
    const roleValue = role || 'USER';
    const emailValue = email || `dev-${roleValue.toLowerCase()}@bookstore.local`;
    const nameValue = name || `Dev ${roleValue.charAt(0) + roleValue.slice(1).toLowerCase()}`;
    
    console.log('🔧 Dev login:', { email: emailValue, name: nameValue, role: roleValue });
    
    // 🔥 Chercher ou créer l'utilisateur dans la base de données
    let user = await prisma.user.findUnique({
      where: { email: emailValue }
    });

    if (!user) {
      // Créer l'utilisateur en base
      const hashedPassword = await bcrypt.hash('devpassword123', 10);
      
      user = await prisma.user.create({
        data: {
          email: emailValue,
          name: nameValue,
          firstName: 'Dev',
          lastName: roleValue,
          password: hashedPassword,
          role: roleValue as any,
          authProvider: 'local',
          emailVerified: true,
          isProfileComplete: true,
          phone: '0612345678',
          commune: 'Paris',
          age: 30,
        }
      });
      console.log('✅ Utilisateur dev créé en base:', user.email);
    }

    // 🔥 Générer un vrai token JWT signé
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password, ...userWithoutPassword } = user;

    res.json({ 
      success: true, 
      token, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('❌ Erreur dev-login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTES GOOGLE AUTH
// ============================================

interface GoogleTokenInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  picture: string;
  locale: string;
  phone?: string;
  phone_verified?: boolean;
  hd?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

router.post('/google/check', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id_token=${token}`,
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const googleUser = await response.json() as GoogleTokenInfo;
    
    const user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    if (!user) {
      return res.json({
        exists: false,
        needsProfile: true,
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`,
        avatar: googleUser.picture || '',
        googleId: googleUser.sub,
      });
    }

    return res.json({
      exists: true,
      needsProfile: !user.isProfileComplete,
      userId: user.id,
      email: user.email,
      name: user.name,
    });

  } catch (error) {
    console.error('❌ Erreur /google/check:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/google/complete-profile', async (req, res) => {
  try {
    const { token, firstName, lastName, phone, age, commune } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    if (!firstName || !lastName || !phone || !age || !commune) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis (prénom, nom, téléphone, âge, commune)' 
      });
    }

    const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id_token=${token}`,
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const googleUser = await response.json() as GoogleTokenInfo;

    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const now = new Date();
    const fullName = `${firstName} ${lastName}`;
    
    const user = await prisma.user.create({
      data: {
        email: googleUser.email,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        age: parseInt(age),
        commune: commune,
        googleId: googleUser.sub,
        avatar: googleUser.picture || '',
        authProvider: 'google',
        emailVerified: true,
        role: 'USER',
        isProfileComplete: true,
        lastLoginAt: now,
      }
    });

    console.log('✅ Nouvel utilisateur inscrit:', user.email);

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password, ...userWithoutPassword } = user;

    return res.json({ 
      success: true, 
      token: jwtToken, 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('❌ Erreur /google/complete-profile:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/google/login', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id_token=${token}`,
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const googleUser = await response.json() as GoogleTokenInfo;
    
    const user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (!user.isProfileComplete) {
      return res.status(400).json({ 
        error: 'Profil incomplet',
        needsProfile: true
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        avatar: googleUser.picture || user.avatar,
        name: googleUser.name || user.name,
      }
    });

    const jwtToken = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password, ...userWithoutPassword } = updatedUser;

    return res.json({ 
      success: true, 
      token: jwtToken, 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('❌ Erreur /google/login:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
  
  const authUrl = 
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=openid%20profile%20email&` +
    `prompt=select_account`;

  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Code manquant' });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
        grant_type: 'authorization_code',
        code: code as string,
      }),
    });

    const tokenData = await tokenResponse.json() as GoogleTokenResponse;
    
    const redirectUrl = `bookstore://auth/success?token=${tokenData.id_token}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Erreur callback Google:', error);
    return res.redirect('bookstore://auth/failed');
  }
});

router.get('/login-failed', (req, res) => {
  return res.redirect('bookstore://auth/failed');
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        age: true,
        commune: true,
        role: true,
        authProvider: true,
        avatar: true,
        emailVerified: true,
        isProfileComplete: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
});

export default router;
