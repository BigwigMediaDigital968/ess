-- Migration: Add contactEmail and gstNumber to Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
