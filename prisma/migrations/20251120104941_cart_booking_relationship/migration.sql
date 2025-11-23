/*
  Warnings:

  - Added the required column `cartId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cartItemId` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED', 'EXPIRED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cartId" TEXT NOT NULL,
ADD COLUMN     "cartItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "convertedToBooking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "bookings_cartId_idx" ON "bookings"("cartId");

-- CreateIndex
CREATE INDEX "bookings_cartItemId_idx" ON "bookings"("cartItemId");

-- CreateIndex
CREATE INDEX "cart_items_convertedToBooking_idx" ON "cart_items"("convertedToBooking");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
