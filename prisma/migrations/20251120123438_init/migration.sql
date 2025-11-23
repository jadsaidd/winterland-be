/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `priceAtAdd` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleId` on the `cart_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartId,eventId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `carts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_scheduleId_fkey";

-- DropIndex
DROP INDEX "bookings_scheduleId_idx";

-- DropIndex
DROP INDEX "cart_items_cartId_scheduleId_key";

-- DropIndex
DROP INDEX "cart_items_scheduleId_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "scheduleId",
ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "cartId" DROP NOT NULL,
ALTER COLUMN "cartItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "priceAtAdd",
DROP COLUMN "scheduleId",
ADD COLUMN     "eventId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileUrl" TEXT;

-- CreateIndex
CREATE INDEX "bookings_eventId_idx" ON "bookings"("eventId");

-- CreateIndex
CREATE INDEX "cart_items_eventId_idx" ON "cart_items"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_eventId_key" ON "cart_items"("cartId", "eventId");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
