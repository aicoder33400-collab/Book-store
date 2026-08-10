import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// 🔥 Configuration de la stratégie Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
      try {
        console.log('📱 Profil Google reçu:', profile);

        // 1. Extraire les informations du profil Google
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || 'Utilisateur';
        const avatar = profile.photos?.[0]?.value || '';

        // 2. Vérifier si l'utilisateur existe déjà
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: googleId },
              { email: email }
            ]
          }
        });

        if (user) {
          // 3. Si l'utilisateur existe, on met à jour ses infos Google si nécessaire
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: googleId,
                avatar: avatar,
                authProvider: 'google',
                emailVerified: true,
              }
            });
          }
          return done(null, user);
        }

        // 4. Créer un nouvel utilisateur
        const newUser = await prisma.user.create({
          data: {
            name: name,
            email: email,
            googleId: googleId,
            avatar: avatar,
            authProvider: 'google',
            emailVerified: true,
            role: 'USER', // Par défaut, rôle utilisateur
          }
        });

        console.log('✅ Nouvel utilisateur créé:', newUser.email);
        return done(null, newUser);

      } catch (error) {
        console.error('❌ Erreur Google Strategy:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Pour la sérialisation (si vous utilisez des sessions)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;