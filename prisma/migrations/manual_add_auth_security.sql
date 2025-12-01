-- AlterTable: login_audit - Add new fields for enhanced security tracking
ALTER TABLE "login_audit" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "login_audit" ADD COLUMN IF NOT EXISTS "session_id" TEXT;
ALTER TABLE "login_audit" ADD COLUMN IF NOT EXISTS "action_type" TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "login_audit_user_id_idx" ON "login_audit"("user_id");
CREATE INDEX IF NOT EXISTS "login_audit_created_at_idx" ON "login_audit"("created_at");

-- AlterTable: sessions - Add location and activity tracking
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "last_activity" TIMESTAMPTZ DEFAULT NOW();

-- Create index for active sessions
CREATE INDEX IF NOT EXISTS "idx_sessions_active" ON "sessions"("is_active");

-- AlterTable: user_passwords - Add first login tracking
ALTER TABLE "user_passwords" ADD COLUMN IF NOT EXISTS "password_expires_at" TIMESTAMPTZ;
ALTER TABLE "user_passwords" ADD COLUMN IF NOT EXISTS "is_first_login" BOOLEAN DEFAULT true;

-- AlterTable: users - Add security fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF  NOT EXISTS "locked_until" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_ip" INET;

-- Update existing records
UPDATE "user_passwords" SET "is_first_login" = false WHERE "password_hash" IS NOT NULL;
UPDATE "sessions" SET "is_active" = (revoked_at IS NULL AND expires_at > NOW());
