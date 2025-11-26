-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('VVIP', 'VIP', 'REGULAR', 'ECONOMY');

-- CreateEnum
CREATE TYPE "SectionPosition" AS ENUM ('CENTER', 'LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "SeatsSessionStatus" AS ENUM ('PENDING', 'CANCELLED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "LocationType" ADD VALUE 'STAGE';

-- AlterTable
ALTER TABLE "user_application_data" ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "location_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "location_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_zones" (
    "id" TEXT NOT NULL,
    "type" "ZoneType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "location_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_pricings" (
    "id" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "discountedPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationZoneId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "zone_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_sections" (
    "id" TEXT NOT NULL,
    "position" "SectionPosition" NOT NULL,
    "numberOfRows" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationZoneId" TEXT NOT NULL,

    CONSTRAINT "location_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_rows" (
    "id" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "location_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_seats" (
    "id" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowId" TEXT NOT NULL,

    CONSTRAINT "location_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_seats" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "isAdminLocked" BOOLEAN NOT NULL DEFAULT false,
    "isReserved" BOOLEAN NOT NULL DEFAULT true,
    "zoneType" "ZoneType" NOT NULL,
    "sectionPosition" "SectionPosition" NOT NULL,
    "rowNumberSnapshot" INTEGER NOT NULL,
    "seatNumberSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SeatsSessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,

    CONSTRAINT "seats_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_templates_locationId_key" ON "location_templates"("locationId");

-- CreateIndex
CREATE INDEX "location_templates_active_idx" ON "location_templates"("active");

-- CreateIndex
CREATE UNIQUE INDEX "zone_pricings_locationZoneId_key" ON "zone_pricings"("locationZoneId");

-- CreateIndex
CREATE UNIQUE INDEX "location_rows_sectionId_rowNumber_key" ON "location_rows"("sectionId", "rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "location_seats_rowId_seatNumber_key" ON "location_seats"("rowId", "seatNumber");

-- CreateIndex
CREATE INDEX "booking_seats_userId_idx" ON "booking_seats"("userId");

-- CreateIndex
CREATE INDEX "booking_seats_bookingId_idx" ON "booking_seats"("bookingId");

-- CreateIndex
CREATE INDEX "booking_seats_scheduleId_idx" ON "booking_seats"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_seats_scheduleId_seatId_key" ON "booking_seats"("scheduleId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_code_key" ON "sessions"("code");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- AddForeignKey
ALTER TABLE "location_templates" ADD CONSTRAINT "location_templates_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_zones" ADD CONSTRAINT "location_zones_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricings" ADD CONSTRAINT "zone_pricings_locationZoneId_fkey" FOREIGN KEY ("locationZoneId") REFERENCES "location_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricings" ADD CONSTRAINT "zone_pricings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_sections" ADD CONSTRAINT "location_sections_locationZoneId_fkey" FOREIGN KEY ("locationZoneId") REFERENCES "location_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_rows" ADD CONSTRAINT "location_rows_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "location_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_seats" ADD CONSTRAINT "location_seats_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "location_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "location_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats_sessions" ADD CONSTRAINT "seats_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats_sessions" ADD CONSTRAINT "seats_sessions_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "location_seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
