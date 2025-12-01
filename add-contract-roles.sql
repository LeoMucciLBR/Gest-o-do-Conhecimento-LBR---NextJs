-- Add missing values to contract_role enum
-- Run this file as the database owner (usually 'postgres')

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'GERENTE_PROJETO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contract_role')) THEN
        ALTER TYPE contract_role ADD VALUE 'GERENTE_PROJETO';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ANALISTA' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contract_role')) THEN
        ALTER TYPE contract_role ADD VALUE 'ANALISTA';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OUTRO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contract_role')) THEN
        ALTER TYPE contract_role ADD VALUE 'OUTRO';
    END IF;
END$$;

-- Verify the enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contract_role') ORDER BY enumsortorder;
