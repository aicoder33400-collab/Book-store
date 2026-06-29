# BookStore - Gestion de bibliothèque

Application full-stack : catalogue de livres, emprunts, gestion d'utilisateurs.

## Prérequis

- Node.js 20+
- PostgreSQL 16
- npm

## Lancement

```bash
# 1. Base de données
sudo pg_ctlcluster 16 main start

# 2. Backend (terminal 1)
cd bookstore-backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
# → http://localhost:3000

# 3. Mobile (terminal 2)
cd bookstore-mobile
npm install
npx expo start --web
# → http://localhost:8082
```

## Comptes de test

| Rôle  | Email                | Mot de passe |
|------|---------------------|-------------|
| Admin | admin@bookstore.com | admin111    |
| Staff | staff@bookstore.com | staff111    |
| User  | user@bookstore.com  | user111     |

## Tester l'emprunt

- User : Catalogue → livre → Emprunter  
- Admin : Dashboard → Approuver → Remettre  
- User : "Mes emprunts" → statut mis à jour  

## Rôles

| Action | Admin | Staff | User |
|--------|------|------|------|
| Dashboard | ✅ | ❌ | ❌ |
| Catalogue | ✅ | ✅ | ✅ |
| Ajouter/Modifier/Supprimer livre | ✅ | ✅ | ❌ |
| Emprunter | ❌ | ❌ | ✅ |
| Gérer emprunts | ✅ | ❌ | ❌ |
| Retourner un livre | ✅ | ✅ | ❌ |
| Voir utilisateurs | ✅ | ❌ | ❌ |
| Mes emprunts | ❌ | ❌ | ✅ |

## Structure

```
bookstore-backend/    # Express + Prisma + PostgreSQL
  src/controllers/    # Routes
  src/services/       # Logique métier
  prisma/schema.prisma
  prisma/seed.ts

bookstore-mobile/     # React Native (Expo) + Zustand
  src/screens/        # Écrans
  src/navigation/     # Navigation par rôle
  src/services/       # Appels API
  src/store/          # État global
```

## Réinitialiser la base

```bash
cd bookstore-backend
npx prisma migrate reset
npx prisma db seed
```
