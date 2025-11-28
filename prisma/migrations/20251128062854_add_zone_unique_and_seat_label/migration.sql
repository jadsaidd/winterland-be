/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `zones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seatLabel` to the `location_seats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "location_seats" ADD COLUMN     "seatLabel" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "location_seats_seatLabel_idx" ON "location_seats"("seatLabel");

-- CreateIndex
CREATE UNIQUE INDEX "zones_type_key" ON "zones"("type");
