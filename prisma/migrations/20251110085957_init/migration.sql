/*
  Warnings:

  - You are about to drop the `event_category_media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "event_category_media" DROP CONSTRAINT "event_category_media_eventCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "event_category_media" DROP CONSTRAINT "event_category_media_mediaId_fkey";

-- DropTable
DROP TABLE "event_category_media";
