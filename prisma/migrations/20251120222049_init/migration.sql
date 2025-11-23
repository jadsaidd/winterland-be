-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT;
