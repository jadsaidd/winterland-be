/*
  Warnings:

  - You are about to drop the `event_locations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `locationId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "event_locations" DROP CONSTRAINT "event_locations_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_locations" DROP CONSTRAINT "event_locations_locationId_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "locationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "event_locations";

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
