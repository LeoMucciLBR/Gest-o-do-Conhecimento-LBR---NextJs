-- Remove unique constraint on (contract_id, role) to allow multiple team members with same role
-- This is needed for the dynamic team management feature

ALTER TABLE contract_participants DROP CONSTRAINT IF EXISTS contract_participants_contract_id_role_key;

-- Verify the constraint was removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'contract_participants'::regclass;
