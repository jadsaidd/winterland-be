-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bookedByAdminId" TEXT,
ADD COLUMN     "isAdminBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduleId" TEXT;

-- CreateIndex
CREATE INDEX "bookings_isAdminBooking_idx" ON "bookings"("isAdminBooking");

-- CreateIndex
CREATE INDEX "bookings_scheduleId_idx" ON "bookings"("scheduleId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
