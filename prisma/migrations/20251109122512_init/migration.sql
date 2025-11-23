-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('WORKER', 'CUSTOMER');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "roleType" "RoleType" NOT NULL DEFAULT 'CUSTOMER';
