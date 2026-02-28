-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'WAITING_FOR_USER', 'PENDING_VENDOR', 'PENDING_OTHER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('INCIDENT', 'SERVICE_REQUEST');

-- CreateEnum
CREATE TYPE "ChangeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTING', 'IMPLEMENTED', 'PIR_PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChangeRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED', 'KNOWN_ERROR', 'CLOSED');

-- CreateEnum
CREATE TYPE "CMDBItemType" AS ENUM ('SERVER', 'VM', 'DATABASE', 'APPLICATION', 'NETWORK', 'ENDPOINT', 'SERVICE', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CMDBItemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "CMDBEnvironment" AS ENUM ('PROD', 'UAT', 'DEV', 'DR', 'STAGING');

-- CreateEnum
CREATE TYPE "CMDBRelationshipType" AS ENUM ('DEPENDS_ON', 'HOSTS', 'RUNS_ON', 'CONNECTS_TO', 'BACKED_UP_BY', 'PART_OF');

-- CreateTable
CREATE TABLE "SLAPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "ticketType" "TicketType" NOT NULL,
    "responseTimeMinutes" INTEGER NOT NULL,
    "resolutionTimeMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDeskTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDeskTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDeskMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceDeskMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategoryModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticketType" "TicketType" NOT NULL DEFAULT 'INCIDENT',
    "teamId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCategoryModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'INCIDENT',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "teamId" TEXT,
    "categoryId" TEXT,
    "slaId" TEXT,
    "slaResponseDue" TIMESTAMP(3),
    "slaResolutionDue" TIMESTAMP(3),
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "ciId" TEXT,
    "problemId" TEXT,
    "changeRequestId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketActivity" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "changeNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "risk" "ChangeRisk" NOT NULL DEFAULT 'LOW',
    "status" "ChangeStatus" NOT NULL DEFAULT 'DRAFT',
    "requesterId" TEXT NOT NULL,
    "approvedById" TEXT,
    "cabMeetingDate" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "rollbackPlan" TEXT,
    "pirNotes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequestCI" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "ciId" TEXT NOT NULL,

    CONSTRAINT "ChangeRequestCI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeComment" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "problemNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "rootCause" TEXT,
    "workaround" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KEDBEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "workaround" TEXT NOT NULL,
    "resolution" TEXT,
    "articleUrl" TEXT,
    "problemId" TEXT,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KEDBEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMDBItem" (
    "id" TEXT NOT NULL,
    "ciNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CMDBItemType" NOT NULL DEFAULT 'SERVER',
    "status" "CMDBItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "environment" "CMDBEnvironment" NOT NULL DEFAULT 'PROD',
    "ownerId" TEXT,
    "managedById" TEXT,
    "ipAddress" TEXT,
    "hostName" TEXT,
    "location" TEXT,
    "description" TEXT,
    "attributes" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMDBItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMDBRelationship" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" "CMDBRelationshipType" NOT NULL DEFAULT 'DEPENDS_ON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMDBRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDeskCounter" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceDeskCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDeskTeam_name_organizationId_key" ON "ServiceDeskTeam"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDeskMember_teamId_userId_key" ON "ServiceDeskMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategoryModel_name_organizationId_key" ON "TicketCategoryModel"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeRequest_changeNumber_key" ON "ChangeRequest"("changeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeRequestCI_changeRequestId_ciId_key" ON "ChangeRequestCI"("changeRequestId", "ciId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_problemNumber_key" ON "Problem"("problemNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KEDBEntry_problemId_key" ON "KEDBEntry"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "CMDBItem_ciNumber_key" ON "CMDBItem"("ciNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CMDBRelationship_sourceId_targetId_relationshipType_key" ON "CMDBRelationship"("sourceId", "targetId", "relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDeskCounter_prefix_key" ON "ServiceDeskCounter"("prefix");

-- AddForeignKey
ALTER TABLE "ServiceDeskMember" ADD CONSTRAINT "ServiceDeskMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ServiceDeskTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketCategoryModel" ADD CONSTRAINT "TicketCategoryModel_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ServiceDeskTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ServiceDeskTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategoryModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_slaId_fkey" FOREIGN KEY ("slaId") REFERENCES "SLAPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES "CMDBItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequestCI" ADD CONSTRAINT "ChangeRequestCI_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequestCI" ADD CONSTRAINT "ChangeRequestCI_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES "CMDBItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeComment" ADD CONSTRAINT "ChangeComment_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KEDBEntry" ADD CONSTRAINT "KEDBEntry_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMDBRelationship" ADD CONSTRAINT "CMDBRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CMDBItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMDBRelationship" ADD CONSTRAINT "CMDBRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CMDBItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed counters
INSERT INTO "ServiceDeskCounter" ("id", "prefix", "current") VALUES
  (gen_random_uuid(), 'INC', 0),
  (gen_random_uuid(), 'SR', 0),
  (gen_random_uuid(), 'C', 0),
  (gen_random_uuid(), 'P', 0),
  (gen_random_uuid(), 'CI', 0);
