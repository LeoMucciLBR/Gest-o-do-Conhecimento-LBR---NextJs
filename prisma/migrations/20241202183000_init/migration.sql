CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "ficha_type" AS ENUM ('INTERNA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "client_role" AS ENUM ('GESTOR_AREA', 'GERENTE_ENGENHARIA');

-- CreateEnum
CREATE TYPE "contract_role" AS ENUM ('GESTOR_AREA', 'GERENTE_ENGENHARIA', 'COORDENADORA', 'ENGENHEIRO_RESPONSAVEL', 'GERENTE_PROJETO', 'ANALISTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('Ativo', 'Inativo', 'Pendente');

-- CreateEnum
CREATE TYPE "document_kind" AS ENUM ('LAMINA', 'OUTRO', 'COVER_IMAGE');

-- CreateEnum
CREATE TYPE "tipo_rodovia" AS ENUM ('FEDERAL', 'ESTADUAL');

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_email" CITEXT,
    "raw_profile" JSONB,
    "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_audit" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "email_input" CITEXT,
    "provider" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "location" TEXT,
    "session_id" TEXT,
    "action_type" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_activity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_passwords" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_expires_at" TIMESTAMP(3),
    "must_change" BOOLEAN NOT NULL DEFAULT false,
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_passwords_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "name" TEXT,
    "picture_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'user',
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ficha_id" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" INET,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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
    "nacionalidade" TEXT,
    "estado_civil" TEXT,
    "genero" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "profissao" TEXT,
    "especialidades" TEXT,
    "registro_profissional" TEXT,
    "resumo_profissional" TEXT,
    "idiomas" TEXT,
    "formacoes" JSONB DEFAULT '[]',
    "experiencias" JSONB DEFAULT '[]',
    "certificados" JSONB DEFAULT '[]',
    "foto_perfil_url" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "ficha_type" NOT NULL DEFAULT 'INTERNA',
    "cargo_cliente" "client_role",

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "office" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "object" TEXT,
    "scope" TEXT,
    "caracteristicas" TEXT,
    "data_inicio" DATE,
    "data_fim" DATE,
    "valor" TEXT,
    "status" "contract_status" NOT NULL DEFAULT 'Ativo',
    "location" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "kind" "document_kind" NOT NULL DEFAULT 'LAMINA',
    "filename" TEXT NOT NULL,
    "content_type" TEXT,
    "storage_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "role" "contract_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rodovias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "uf" VARCHAR(2),
    "km_inicial" DECIMAL(10,3) NOT NULL,
    "km_final" DECIMAL(10,3) NOT NULL,
    "geometria" geometry,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "extensao_km" DECIMAL(10,3),
    "tipo" VARCHAR(20),
    "descricao" TEXT,

    CONSTRAINT "rodovias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" SERIAL NOT NULL,
    "rodovia_id" INTEGER,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "km_inicio" DECIMAL(10,3) NOT NULL,
    "km_fim" DECIMAL(10,3) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'planejada',
    "data_inicio" DATE,
    "data_fim_prevista" DATE,
    "geometria" geometry,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "contract_id" UUID,
    "tipo_rodovia" "tipo_rodovia" NOT NULL DEFAULT 'ESTADUAL',
    "uf" CHAR(2),
    "br_codigo" VARCHAR(10),

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra_annotations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obra_id" INTEGER NOT NULL,
    "user_id" UUID,
    "annotation" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obra_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obra_id" INTEGER NOT NULL,
    "user_id" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(100),
    "storage_url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obra_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra_non_conformities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obra_id" INTEGER NOT NULL,
    "user_id" UUID,
    "km" DECIMAL(10,3) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(50) DEFAULT 'BAIXA',
    "status" VARCHAR(50) DEFAULT 'ABERTA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obra_non_conformities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformity_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "non_conformity_id" UUID NOT NULL,
    "user_id" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(100),
    "storage_url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_conformity_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "parent_folder_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "folder_order" INTEGER DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurement_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "folder_id" UUID,
    "contract_id" UUID NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "original_filename" VARCHAR(500) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(255),
    "file_hash" VARCHAR(64),
    "file_type" VARCHAR(50),
    "tags" TEXT[],
    "version" INTEGER DEFAULT 1,
    "is_latest" BOOLEAN DEFAULT true,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "measurement_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "contract_id" UUID,
    "can_read" BOOLEAN DEFAULT true,
    "can_write" BOOLEAN DEFAULT false,
    "can_delete" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "parent_folder_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "folder_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "folder_id" UUID,
    "contract_id" UUID NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "original_filename" VARCHAR(500) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(255),
    "file_hash" VARCHAR(64),
    "file_type" VARCHAR(50),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSON NOT NULL DEFAULT '{}',

    CONSTRAINT "product_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segmento_rodovia" (
    "id" SERIAL NOT NULL,
    "rodovia_codigo" VARCHAR(20),
    "uf" VARCHAR(2),
    "km_inicial" DECIMAL(10,3),
    "km_final" DECIMAL(10,3),
    "extensao_km" DECIMAL(10,3),
    "local_inicio" TEXT,
    "local_fim" TEXT,
    "tipo" VARCHAR(20),
    "geom" geometry,

    CONSTRAINT "segmento_rodovia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_provider_user_id_key" ON "auth_identities"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");

-- CreateIndex
CREATE INDEX "login_audit_user_id_idx" ON "login_audit"("user_id");

-- CreateIndex
CREATE INDEX "login_audit_created_at_idx" ON "login_audit"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_user_expires" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "idx_sessions_active" ON "sessions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_ficha_id_key" ON "users"("ficha_id");

-- CreateIndex
CREATE INDEX "fichas_email_idx" ON "fichas"("email");

-- CreateIndex
CREATE INDEX "fichas_nome_idx" ON "fichas"("nome");

-- CreateIndex
CREATE INDEX "fichas_profissao_idx" ON "fichas"("profissao");

-- CreateIndex
CREATE INDEX "idx_people_org" ON "people"("organization_id");

-- CreateIndex
CREATE INDEX "idx_contracts_org" ON "contracts"("organization_id");

-- CreateIndex
CREATE INDEX "idx_contracts_status" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "idx_docs_contract" ON "contract_documents"("contract_id");

-- CreateIndex
CREATE INDEX "idx_participants_contract" ON "contract_participants"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "rodovias_codigo_key" ON "rodovias"("codigo");

-- CreateIndex
CREATE INDEX "idx_rodovias_geometria" ON "rodovias" USING GIST ("geometria");

-- CreateIndex
CREATE UNIQUE INDEX "rodovias_codigo_uf_unique" ON "rodovias"("codigo", "uf");

-- CreateIndex
CREATE INDEX "idx_obras_contract_id" ON "obras"("contract_id");

-- CreateIndex
CREATE INDEX "idx_obras_geometria" ON "obras" USING GIST ("geometria");

-- CreateIndex
CREATE INDEX "idx_obras_rodovia" ON "obras"("rodovia_id");

-- CreateIndex
CREATE INDEX "idx_obra_annotations_obra" ON "obra_annotations"("obra_id");

-- CreateIndex
CREATE INDEX "idx_obra_photos_obra" ON "obra_photos"("obra_id");

-- CreateIndex
CREATE INDEX "idx_nc_obra" ON "obra_non_conformities"("obra_id");

-- CreateIndex
CREATE INDEX "idx_nc_photos" ON "non_conformity_photos"("non_conformity_id");

-- CreateIndex
CREATE INDEX "idx_folders_contract" ON "measurement_folders"("contract_id");

-- CreateIndex
CREATE INDEX "idx_folders_parent" ON "measurement_folders"("parent_folder_id");

-- CreateIndex
CREATE INDEX "idx_folders_created_by" ON "measurement_folders"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "unique_folder_name" ON "measurement_folders"("contract_id", "parent_folder_id", "name");

-- CreateIndex
CREATE INDEX "idx_files_folder" ON "measurement_files"("folder_id");

-- CreateIndex
CREATE INDEX "idx_files_contract" ON "measurement_files"("contract_id");

-- CreateIndex
CREATE INDEX "idx_files_type" ON "measurement_files"("file_type");

-- CreateIndex
CREATE INDEX "idx_files_uploaded_by" ON "measurement_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "idx_files_tags" ON "measurement_files" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "idx_permissions_user" ON "file_permissions"("user_id");

-- CreateIndex
CREATE INDEX "idx_permissions_contract" ON "file_permissions"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_contract_permission" ON "file_permissions"("user_id", "contract_id");

-- CreateIndex
CREATE INDEX "idx_product_folders_contract" ON "product_folders"("contract_id");

-- CreateIndex
CREATE INDEX "idx_product_folders_parent" ON "product_folders"("parent_folder_id");

-- CreateIndex
CREATE INDEX "idx_product_folders_created_by" ON "product_folders"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "unique_product_folder_name" ON "product_folders"("contract_id", "parent_folder_id", "name");

-- CreateIndex
CREATE INDEX "idx_product_files_folder" ON "product_files"("folder_id");

-- CreateIndex
CREATE INDEX "idx_product_files_contract" ON "product_files"("contract_id");

-- CreateIndex
CREATE INDEX "idx_product_files_type" ON "product_files"("file_type");

-- CreateIndex
CREATE INDEX "idx_product_files_uploaded_by" ON "product_files"("uploaded_by");

-- CreateIndex
CREATE UNIQUE INDEX "segmento_rodovia_unico" ON "segmento_rodovia"("rodovia_codigo", "uf", "km_inicial", "km_final");

-- CreateIndex
CREATE UNIQUE INDEX "trecho_unico" ON "segmento_rodovia"("rodovia_codigo", "uf", "km_inicial", "km_final");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "login_audit" ADD CONSTRAINT "login_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_passwords" ADD CONSTRAINT "user_passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_rodovia_id_fkey" FOREIGN KEY ("rodovia_id") REFERENCES "rodovias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_annotations" ADD CONSTRAINT "obra_annotations_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_annotations" ADD CONSTRAINT "obra_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_photos" ADD CONSTRAINT "obra_photos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_photos" ADD CONSTRAINT "obra_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_non_conformities" ADD CONSTRAINT "obra_non_conformities_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "obra_non_conformities" ADD CONSTRAINT "obra_non_conformities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformity_photos" ADD CONSTRAINT "non_conformity_photos_non_conformity_id_fkey" FOREIGN KEY ("non_conformity_id") REFERENCES "obra_non_conformities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformity_photos" ADD CONSTRAINT "non_conformity_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_folders" ADD CONSTRAINT "measurement_folders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_folders" ADD CONSTRAINT "measurement_folders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_folders" ADD CONSTRAINT "measurement_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "measurement_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_files" ADD CONSTRAINT "measurement_files_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_files" ADD CONSTRAINT "measurement_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "measurement_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "measurement_files" ADD CONSTRAINT "measurement_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_folders" ADD CONSTRAINT "fk_product_folders_contract" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_folders" ADD CONSTRAINT "fk_product_folders_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_folders" ADD CONSTRAINT "fk_product_folders_parent" FOREIGN KEY ("parent_folder_id") REFERENCES "product_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "fk_product_files_contract" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "fk_product_files_folder" FOREIGN KEY ("folder_id") REFERENCES "product_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "fk_product_files_uploader" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

