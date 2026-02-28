-- AlterTable: Add branding columns to Organization
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "primaryColor"   TEXT DEFAULT '#a855f7',
ADD COLUMN IF NOT EXISTS "accentColor"    TEXT DEFAULT '#ec4899',
ADD COLUMN IF NOT EXISTS "themeMode"      TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS "loginBgUrl"     TEXT,
ADD COLUMN IF NOT EXISTS "loginBgType"    TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS "website"        TEXT;
