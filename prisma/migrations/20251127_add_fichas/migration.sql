-- CreateTable
CREATE TABLE "fichas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "profissao" TEXT,
    "especialidade" TEXT,
    "formacao" TEXT,
    "instituicao" TEXT,
    "ano_formacao" INTEGER,
    "registro_profissional" TEXT,
    "foto_perfil_url" TEXT,
    "linkedin_url" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- Add optional ficha_id to users table
ALTER TABLE "users" ADD COLUMN "ficha_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX "fichas_nome_idx" ON "fichas"("nome");
CREATE INDEX "fichas_email_idx" ON "fichas"("email");
CREATE INDEX "fichas_profissao_idx" ON "fichas"("profissao");
CREATE UNIQUE INDEX "users_ficha_id_key" ON "users"("ficha_id");
