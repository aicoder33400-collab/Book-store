-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED', 'LATE');

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "BookGenre" AS ENUM ('ROMAN', 'POESIE', 'THEATRE', 'HISTOIRE', 'SCIENCE_FICTION', 'FANTASTIQUE', 'POLAR', 'AVENTURE', 'BIOGRAPHIE', 'ESSAI', 'PHILOSOPHIE', 'JEUNESSE', 'BANDE_DESSINEE', 'ART', 'CUISINE', 'VOYAGE', 'SPORT', 'SANTE', 'RELIGION', 'AUTRE');

-- CreateEnum
CREATE TYPE "BookLanguage" AS ENUM ('FRANCAIS', 'ANGLAIS', 'ARABE', 'ESPAGNOL', 'ALLEMAND', 'ITALIEN', 'PORTUGAIS', 'RUSSE', 'CHINOIS', 'JAPONAIS', 'AUTRE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "googleId" TEXT,
    "avatar" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "firstName" TEXT,
    "lastName" TEXT,
    "age" INTEGER,
    "commune" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "verificationCode" TEXT,
    "resetCode" TEXT,
    "resetCodeExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "description" TEXT,
    "isForRent" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "genre" "BookGenre" NOT NULL DEFAULT 'AUTRE',
    "language" "BookLanguage" NOT NULL DEFAULT 'FRANCAIS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copies" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "copyNumber" INTEGER NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'BORROWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "copies_bookId_copyNumber_key" ON "copies"("bookId", "copyNumber");

-- CreateIndex
CREATE INDEX "loans_userId_idx" ON "loans"("userId");

-- CreateIndex
CREATE INDEX "loans_copyId_idx" ON "loans"("copyId");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- AddForeignKey
ALTER TABLE "copies" ADD CONSTRAINT "copies_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
