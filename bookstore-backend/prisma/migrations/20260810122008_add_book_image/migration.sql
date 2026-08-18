/*
  Warnings:

  - You are about to drop the column `isForSale` on the `books` table. All the data in the column will be lost.
  - You are about to drop the `sales` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_bookId_fkey";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "isForSale",
ADD COLUMN     "imageUrl" TEXT;

-- DropTable
DROP TABLE "sales";
