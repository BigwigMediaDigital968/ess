/*
  Warnings:

  - You are about to drop the column `feedback` on the `Assessment` table. All the data in the column will be lost.
  - You are about to alter the column `score` on the `Assessment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Made the column `status` on table `Assessment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "feedback",
ADD COLUMN     "analysisReport" TEXT,
ALTER COLUMN "score" SET DATA TYPE INTEGER,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
