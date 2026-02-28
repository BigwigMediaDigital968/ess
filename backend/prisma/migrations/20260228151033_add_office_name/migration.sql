/*
  Warnings:

  - Made the column `organizationId` on table `Department` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('STANDARD', 'NORMAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ChangeImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ChangeUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_organizationId_fkey";

-- AlterTable
ALTER TABLE "AppraisalCycle" ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'GOAL_SETTING';

-- AlterTable
ALTER TABLE "AppraisalGoal" ADD COLUMN     "hrApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kraCategory" TEXT,
ADD COLUMN     "managerComment" TEXT,
ADD COLUMN     "managerRating" DOUBLE PRECISION,
ADD COLUMN     "managerReviewedAt" TIMESTAMP(3),
ADD COLUMN     "selfAttachmentUrl" TEXT,
ADD COLUMN     "selfComment" TEXT,
ADD COLUMN     "selfRating" DOUBLE PRECISION,
ADD COLUMN     "selfSubmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AppraisalReview" ADD COLUMN     "newCTC" DOUBLE PRECISION,
ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "ChangeRequest" ADD COLUMN     "assignmentGroupId" TEXT,
ADD COLUMN     "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "impact" "ChangeImpact" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "implementationPlan" TEXT,
ADD COLUMN     "implementerId" TEXT,
ADD COLUMN     "justification" TEXT,
ADD COLUMN     "testPlan" TEXT,
ADD COLUMN     "type" "ChangeType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "urgency" "ChangeUrgency" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "assignmentGroupId" TEXT,
ADD COLUMN     "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "impact" "TicketPriority" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "priority" "TicketPriority" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "urgency" "TicketPriority" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "SalaryStructure" ADD COLUMN     "ctcAnnual" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordLastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateTable
CREATE TABLE "OffboardingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastDay" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "initiatedBy" TEXT NOT NULL DEFAULT 'SELF',
    "managerApprovedAt" TIMESTAMP(3),
    "itClearedAt" TIMESTAMP(3),
    "hrApprovedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffboardingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamBudget" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "departmentId" TEXT,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "usedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HikeAllocation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "hikePercent" DOUBLE PRECISION NOT NULL,
    "hikeAmount" DOUBLE PRECISION NOT NULL,
    "newCTC" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HikeAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeApproval" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeActivity" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemActivity" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingRequest_userId_key" ON "OffboardingRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamBudget_cycleId_managerId_key" ON "TeamBudget"("cycleId", "managerId");

-- CreateIndex
CREATE UNIQUE INDEX "HikeAllocation_cycleId_userId_key" ON "HikeAllocation"("cycleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeApproval_changeRequestId_approverId_key" ON "ChangeApproval"("changeRequestId", "approverId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingRequest" ADD CONSTRAINT "OffboardingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamBudget" ADD CONSTRAINT "TeamBudget_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_implementerId_fkey" FOREIGN KEY ("implementerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeApproval" ADD CONSTRAINT "ChangeApproval_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeApproval" ADD CONSTRAINT "ChangeApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeActivity" ADD CONSTRAINT "ChangeActivity_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategoryModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemActivity" ADD CONSTRAINT "ProblemActivity_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemActivity" ADD CONSTRAINT "ProblemActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
