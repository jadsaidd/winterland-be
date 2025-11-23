/*
  Warnings:

  - You are about to drop the column `appVersion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deviceToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "appVersion",
DROP COLUMN "deviceToken",
DROP COLUMN "timezone";

-- CreateTable
CREATE TABLE "user_application_data" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceModel" TEXT,
    "osName" TEXT,
    "osVersion" TEXT,
    "appPlatform" TEXT,
    "fcmToken" TEXT,
    "timezoneName" TEXT DEFAULT 'UTC',
    "timezoneOffset" INTEGER,
    "appVersion" TEXT,
    "buildNumber" TEXT,
    "lastKnownIpAddress" TEXT,
    "currentIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_application_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_application_data_userId_key" ON "user_application_data"("userId");

-- AddForeignKey
ALTER TABLE "user_application_data" ADD CONSTRAINT "user_application_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
