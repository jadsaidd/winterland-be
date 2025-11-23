-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('STADIUM', 'ARENA', 'THEATRE', 'HALL', 'OUTDOOR', 'INDOOR', 'OTHER');

-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'BANNER';

-- AlterTable
ALTER TABLE "application_features" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "locationSlug" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "type" "LocationType" NOT NULL DEFAULT 'OTHER',
    "capacity" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_locations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "event_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_workers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "schedule_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_media" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_category_media" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventCategoryId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "event_category_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_media" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "location_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_eventSlug_key" ON "events"("eventSlug");

-- CreateIndex
CREATE INDEX "events_active_idx" ON "events"("active");

-- CreateIndex
CREATE INDEX "events_startAt_idx" ON "events"("startAt");

-- CreateIndex
CREATE INDEX "events_endAt_idx" ON "events"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_categorySlug_key" ON "categories"("categorySlug");

-- CreateIndex
CREATE INDEX "categories_active_idx" ON "categories"("active");

-- CreateIndex
CREATE INDEX "event_categories_categoryId_idx" ON "event_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_eventId_categoryId_key" ON "event_categories"("eventId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_locationSlug_key" ON "locations"("locationSlug");

-- CreateIndex
CREATE INDEX "locations_active_idx" ON "locations"("active");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "event_locations_locationId_idx" ON "event_locations"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_locations_eventId_locationId_key" ON "event_locations"("eventId", "locationId");

-- CreateIndex
CREATE INDEX "schedules_startAt_endAt_idx" ON "schedules"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "schedules_eventId_idx" ON "schedules"("eventId");

-- CreateIndex
CREATE INDEX "schedules_startAt_idx" ON "schedules"("startAt");

-- CreateIndex
CREATE INDEX "schedules_endAt_idx" ON "schedules"("endAt");

-- CreateIndex
CREATE INDEX "schedule_workers_userId_idx" ON "schedule_workers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_workers_scheduleId_userId_key" ON "schedule_workers"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "event_media_mediaId_idx" ON "event_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "event_media_eventId_mediaId_key" ON "event_media"("eventId", "mediaId");

-- CreateIndex
CREATE INDEX "event_category_media_mediaId_idx" ON "event_category_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "event_category_media_eventCategoryId_mediaId_key" ON "event_category_media"("eventCategoryId", "mediaId");

-- CreateIndex
CREATE INDEX "location_media_mediaId_idx" ON "location_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "location_media_locationId_mediaId_key" ON "location_media"("locationId", "mediaId");

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_workers" ADD CONSTRAINT "schedule_workers_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_workers" ADD CONSTRAINT "schedule_workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_category_media" ADD CONSTRAINT "event_category_media_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_category_media" ADD CONSTRAINT "event_category_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_media" ADD CONSTRAINT "location_media_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_media" ADD CONSTRAINT "location_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
