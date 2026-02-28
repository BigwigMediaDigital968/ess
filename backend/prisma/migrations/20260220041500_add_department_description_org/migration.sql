-- Add description and organizationId to Department table
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add foreign key constraint (optional, skip if it conflicts with existing data)
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop the old global unique constraint on name and add a composite one
ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_name_key";

-- Add the new unique constraint (name + org) only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Department_name_organizationId_key'
  ) THEN
    ALTER TABLE "Department" ADD CONSTRAINT "Department_name_organizationId_key" UNIQUE ("name", "organizationId");
  END IF;
END$$;
