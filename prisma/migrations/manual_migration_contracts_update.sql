-- =====================================================
-- Migração: Atualizar Tabela Contracts
-- Data: 2025-12-02
-- Descrição: Remover campos lote4 e lote5
--            Adicionar campos caracteristicas, data_inicio, data_fim, valor
-- =====================================================

-- ATENÇÃO: Execute este script no seu banco de dados PostgreSQL
-- Certifique-se de fazer um backup antes de executar!

BEGIN;

-- 1. Adicionar novos campos
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS caracteristicas TEXT,
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE,
  ADD COLUMN IF NOT EXISTS valor VARCHAR(255);

-- 2. Remover campos antigos (lote4 e lote5)
-- ATENÇÃO: Isso apagará os dados desses campos!
-- Se você precisa dos dados, faça backup antes!
ALTER TABLE contracts 
  DROP COLUMN IF EXISTS lote4,
  DROP COLUMN IF EXISTS lote5;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN contracts.caracteristicas IS 'Características principais do contrato';
COMMENT ON COLUMN contracts.data_inicio IS 'Data de início do contrato';
COMMENT ON COLUMN contracts.data_fim IS 'Data de término do contrato';
COMMENT ON COLUMN contracts.valor IS 'Valor do contrato em formato de moeda (ex: R$ 1.000.000,00)';

COMMIT;

-- Verificar as alterações
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name IN ('caracteristicas', 'data_inicio', 'data_fim', 'valor', 'lote4', 'lote5')
ORDER BY column_name;

-- =====================================================
-- Fim da Migração
-- =====================================================
