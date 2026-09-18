-- CreateEnum
CREATE TYPE "PrayerSlot" AS ENUM ('DOHR', 'ASR', 'MAGHREB');

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "pickupDate" TIMESTAMP(3),
ADD COLUMN     "pickupPrayer" "PrayerSlot";
