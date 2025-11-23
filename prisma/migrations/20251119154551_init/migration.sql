/*
  Warnings:

  - Made the column `name` on table `payment_methods` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `currency` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_methods" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "payment_methods_isActive_idx" ON "payment_methods"("isActive");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_isTestUser_idx" ON "users"("isTestUser");

-- CreateIndex
CREATE INDEX "users_platform_idx" ON "users"("platform");
