-- Add fichas table and relationship to users
-- Execute this SQL directly in your PostgreSQL database

-- CreateTable fichas
CREATE TABLE IF NOT EXISTS "fichas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "nacionalidade" TEXT,
    "estado_civil" TEXT,
    "genero" TEXT,
    
    -- Endereço
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    
    -- Profissional
    "profissao" TEXT,
    "especialidades" TEXT,
    "registro_profissional" TEXT,
    "resumo_profissional" TEXT,
    "idiomas" TEXT,
    
    -- Formação (JSON array)
    "formacoes" JSONB DEFAULT '[]',
    
    -- Experiências (JSON array)
    "experiencias" JSONB DEFAULT '[]',
    
    -- Certificados (JSON array)
    "certificados" JSONB DEFAULT '[]',
    
    -- Mídia
    "foto_perfil_url" TEXT,
    
    -- Observações
    "observacoes" TEXT,
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- Add ficha_id to users table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'ficha_id'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "ficha_id" TEXT;
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_ficha_id_fkey'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_ficha_id_fkey" 
        FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "fichas_nome_idx" ON "fichas"("nome");
CREATE INDEX IF NOT EXISTS "fichas_email_idx" ON "fichas"("email");
CREATE INDEX IF NOT EXISTS "fichas_profissao_idx" ON "fichas"("profissao");
CREATE UNIQUE INDEX IF NOT EXISTS "users_ficha_id_key" ON "users"("ficha_id");

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_fichas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fichas_updated_at_trigger ON fichas;
CREATE TRIGGER fichas_updated_at_trigger
BEFORE UPDATE ON fichas
FOR EACH ROW
EXECUTE FUNCTION update_fichas_updated_at();
