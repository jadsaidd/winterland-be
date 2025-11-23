-- CreateTable
CREATE TABLE "category_media" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "category_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_media_mediaId_idx" ON "category_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "category_media_categoryId_mediaId_key" ON "category_media"("categoryId", "mediaId");

-- AddForeignKey
ALTER TABLE "category_media" ADD CONSTRAINT "category_media_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_media" ADD CONSTRAINT "category_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
