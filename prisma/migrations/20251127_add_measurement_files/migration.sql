-- Migration: Add Measurement File Explorer Tables
-- Created: 2025-11-27

-- Table for folder hierarchy
CREATE TABLE IF NOT EXISTS measurement_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES measurement_folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  folder_order INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_folder_name UNIQUE(contract_id, parent_folder_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_contract ON measurement_folders(contract_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON measurement_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON measurement_folders(created_by);

-- Table for file storage
CREATE TABLE IF NOT EXISTS measurement_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES measurement_folders(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- File metadata
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255),
  file_hash VARCHAR(64), -- SHA-256 for integrity
  
  -- Categorization
  file_type VARCHAR(50), -- 'PDF', 'IMAGE', 'SPREADSHEET', 'DOCUMENT', 'OTHER'
  tags TEXT[], -- Array of tags for search
  
  -- Versioning
  version INT DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  
  -- Audit
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for files
CREATE INDEX IF NOT EXISTS idx_files_folder ON measurement_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_contract ON measurement_files(contract_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON measurement_files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_tags ON measurement_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON measurement_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_latest ON measurement_files(is_latest) WHERE is_latest = TRUE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_measurement_folders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_measurement_files_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS measurement_folders_updated_at ON measurement_folders;
CREATE TRIGGER measurement_folders_updated_at
BEFORE UPDATE ON measurement_folders
FOR EACH ROW
EXECUTE FUNCTION update_measurement_folders_timestamp();

DROP TRIGGER IF EXISTS measurement_files_updated_at ON measurement_files;
CREATE TRIGGER measurement_files_updated_at
BEFORE UPDATE ON measurement_files
FOR EACH ROW
EXECUTE FUNCTION update_measurement_files_timestamp();

-- Optional: File permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_contract_permission UNIQUE(user_id, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user ON file_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_contract ON file_permissions(contract_id);

-- Comments for documentation
COMMENT ON TABLE measurement_folders IS 'Hierarchical folder structure for organizing measurement files';
COMMENT ON TABLE measurement_files IS 'Metadata and references for uploaded measurement files';
COMMENT ON TABLE file_permissions IS 'Fine-grained access control for file operations';
COMMENT ON COLUMN measurement_files.file_hash IS 'SHA-256 hash for file integrity verification';
COMMENT ON COLUMN measurement_files.version IS 'Version number for file versioning support';
COMMENT ON COLUMN measurement_files.is_latest IS 'Flag to indicate if this is the latest version';
