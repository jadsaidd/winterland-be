/*
  Warnings:

  - You are about to drop the column `priority` on the `location_zones` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `location_zones` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locationId,zoneId]` on the table `location_zones` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[locationZoneId,eventId,scheduleId]` on the table `zone_pricings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `zoneId` to the `location_zones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleId` to the `zone_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneId` to the `zone_pricings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "zone_pricings_locationZoneId_key";

-- AlterTable
ALTER TABLE "location_zones" DROP COLUMN "priority",
DROP COLUMN "type",
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "zone_pricings" ADD COLUMN     "scheduleId" TEXT NOT NULL,
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "type" "ZoneType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_zones_locationId_zoneId_key" ON "location_zones"("locationId", "zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "zone_pricings_locationZoneId_eventId_scheduleId_key" ON "zone_pricings"("locationZoneId", "eventId", "scheduleId");

-- AddForeignKey
ALTER TABLE "location_zones" ADD CONSTRAINT "location_zones_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricings" ADD CONSTRAINT "zone_pricings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricings" ADD CONSTRAINT "zone_pricings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
