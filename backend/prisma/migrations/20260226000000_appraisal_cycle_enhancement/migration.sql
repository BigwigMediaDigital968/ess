-- Migration: Add appraisal goal acceptance + annual review fields
-- Date: 20260226

-- AppraisalGoal: employee acceptance fields
ALTER TABLE "AppraisalGoal" ADD COLUMN IF NOT EXISTS "acceptedByEmployee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppraisalGoal" ADD COLUMN IF NOT EXISTS "employeeConcern" TEXT;
ALTER TABLE "AppraisalGoal" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

-- AppraisalReview: annual/final rating fields
ALTER TABLE "AppraisalReview" ADD COLUMN IF NOT EXISTS "annualSelfRating" DOUBLE PRECISION;
ALTER TABLE "AppraisalReview" ADD COLUMN IF NOT EXISTS "managerFinalRating" DOUBLE PRECISION;
ALTER TABLE "AppraisalReview" ADD COLUMN IF NOT EXISTS "finalApprovedBy" TEXT;
ALTER TABLE "AppraisalReview" ADD COLUMN IF NOT EXISTS "finalApprovedAt" TIMESTAMP(3);
ALTER TABLE "AppraisalReview" ADD COLUMN IF NOT EXISTS "letterSentAt" TIMESTAMP(3);

-- AppraisalCycle: ensure phase column has right default
-- ALTER TABLE "AppraisalCycle" ALTER COLUMN "phase" SET DEFAULT 'KRA_DRAFT';
