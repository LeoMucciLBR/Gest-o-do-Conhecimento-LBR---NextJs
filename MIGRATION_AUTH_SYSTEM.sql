-- =====================================================
-- MIGRATION: Advanced Authentication System
-- Description: Adiciona campos para sistema avançado de autenticação,
--              logs de acesso e gerenciamento de sessões
-- Date: 2025-12-01
-- =====================================================

-- =====================================================
-- PARTE 1: Atualizar tabela login_audit
-- Adiciona campos para rastreamento mais detalhado
-- =====================================================

-- Adicionar novos campos
ALTER TABLE "login_audit" 
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "action_type" TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "login_audit_user_id_idx" ON "login_audit"("user_id");
CREATE INDEX IF NOT EXISTS "login_audit_created_at_idx" ON "login_audit"("created_at");
CREATE INDEX IF NOT EXISTS "login_audit_action_type_idx" ON "login_audit"("action_type");

-- =====================================================
-- PARTE 2: Atualizar tabela sessions
-- Adiciona rastreamento de localização e atividade
-- =====================================================

-- Adicionar novos campos
ALTER TABLE "sessions" 
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "last_activity" TIMESTAMPTZ DEFAULT NOW();

-- Criar índice para sessões ativas
CREATE INDEX IF NOT EXISTS "idx_sessions_active" ON "sessions"("is_active");

-- Atualizar sessões existentes (marcar como ativas se não expiradas e não revogadas)
UPDATE "sessions" 
SET "is_active" = (revoked_at IS NULL AND expires_at > NOW())
WHERE "is_active" IS NULL;

-- =====================================================
-- PARTE 3: Atualizar tabela user_passwords
-- Adiciona campos para primeiro login e expiração
-- =====================================================

-- Adicionar novos campos
ALTER TABLE "user_passwords" 
  ADD COLUMN IF NOT EXISTS "password_expires_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "is_first_login" BOOLEAN DEFAULT true;

-- Atualizar registros existentes (usuários com senha já cadastrada não são primeiro login)
UPDATE "user_passwords" 
SET "is_first_login" = false 
WHERE "password_hash" IS NOT NULL AND "is_first_login" IS NULL;

-- =====================================================
-- PARTE 4: Atualizar tabela users
-- Adiciona campos de segurança e controle de conta
-- =====================================================

-- Adicionar novos campos
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "last_login_ip" INET;

-- Inicializar campos para usuários existentes
UPDATE "users" 
SET "failed_login_attempts" = 0 
WHERE "failed_login_attempts" IS NULL;

-- =====================================================
-- VERIFICAÇÃO: Conferir se tudo foi aplicado
-- Execute estas queries para verificar
-- =====================================================

-- Verificar colunas adicionadas em login_audit
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'login_audit' 
  AND column_name IN ('location', 'session_id', 'action_type')
ORDER BY column_name;

-- Verificar colunas adicionadas em sessions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name IN ('location', 'is_active', 'last_activity')
ORDER BY column_name;

-- Verificar colunas adicionadas em user_passwords
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_passwords' 
  AND column_name IN ('password_expires_at', 'is_first_login')
ORDER BY column_name;

-- Verificar colunas adicionadas em users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('failed_login_attempts', 'locked_until', 'last_login_at', 'last_login_ip')
ORDER BY column_name;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
