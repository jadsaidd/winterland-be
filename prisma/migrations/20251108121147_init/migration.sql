-- CreateEnum
CREATE TYPE "UserPlatform" AS ENUM ('Mobile', 'Dashboard');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "platform" "UserPlatform" DEFAULT 'Mobile';
