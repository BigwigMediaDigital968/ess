-- ESS DB Cleanup Script
-- Keep only: Suramya (d88632bd), Digvijay (6ec48729), RajMohan (f02680be)
-- Clear all appraisal data, delete all other users

BEGIN;

-- Identify users to delete
CREATE TEMP TABLE keep_ids AS
SELECT id FROM "User"
WHERE id IN (
    'd88632bd-6f40-48c1-92ea-3be4bea043be',  -- Suramya
    '6ec48729-b324-4e3c-b114-58cd03058faf',  -- Digvijay
    'f02680be-4fe3-492a-b315-e0a07d1c7d25'   -- RajMohan
);

-- ── 1. Clear ALL appraisal data ──────────────────────────────────────────────
DELETE FROM "AppraisalGoal";
DELETE FROM "AppraisalReview";
DELETE FROM "AppraisalCycle";

SELECT 'Appraisal data cleared' AS status;

-- ── 2. Clean up dependent records for users to delete ────────────────────────
-- Unassign assets
UPDATE "Asset" SET "assignedToId" = NULL, status = 'IN_STOCK'
WHERE "assignedToId" NOT IN (SELECT id FROM keep_ids);

-- Clear manager references pointing to deleted users
UPDATE "User" SET "managerId" = NULL
WHERE "managerId" NOT IN (SELECT id FROM keep_ids)
  AND "managerId" IS NOT NULL;

-- Delete attendance, leave, leavebalance, roster, notifications etc.
DELETE FROM "Attendance"   WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Leave"        WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "LeaveBalance" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Roster"       WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "PayrollRecord" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Payroll"      WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "SalaryStructure" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Document"     WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Certification" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "WorkExperience" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Skill"        WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Performance"  WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "OffboardingRequest" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "HikeAllocation" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "OfficeVisitRequest" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "WFHLocation"  WHERE "userId" NOT IN (SELECT id FROM keep_ids);

-- Chat/messaging cleanup
DELETE FROM "MessageReadStatus" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "ConversationParticipant" WHERE "userId" NOT IN (SELECT id FROM keep_ids);
DELETE FROM "Message" WHERE "senderId" NOT IN (SELECT id FROM keep_ids);

-- Remove conversations that have no participants
DELETE FROM "Conversation"
WHERE id NOT IN (SELECT "conversationId" FROM "ConversationParticipant");

-- ── 3. Delete the unwanted users ─────────────────────────────────────────────
DELETE FROM "User" WHERE id NOT IN (SELECT id FROM keep_ids);
SELECT 'Users deleted' AS status, COUNT(*) AS remaining FROM "User";

-- ── 4. Make Suramya the org owner ────────────────────────────────────────────
UPDATE "Organization"
SET "ownerId" = 'd88632bd-6f40-48c1-92ea-3be4bea043be'
WHERE id = (SELECT "organizationId" FROM "User" WHERE id = 'd88632bd-6f40-48c1-92ea-3be4bea043be');

UPDATE "User"
SET "LegacyRole" = 'OWNER'
WHERE id = 'd88632bd-6f40-48c1-92ea-3be4bea043be';

SELECT 'Done! Suramya is now OWNER' AS status;

-- ── 5. Verify ─────────────────────────────────────────────────────────────────
SELECT name, email, "LegacyRole" FROM "User" ORDER BY name;

COMMIT;
