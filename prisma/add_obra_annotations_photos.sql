-- Migration: Add obra annotations and photos tables
-- Date: 2025-11-26
-- Description: Creates tables for storing annotations and photos associated with road segments (obras)

-- Create obra_annotations table
CREATE TABLE IF NOT EXISTS obra_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  annotation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create obra_photos table
CREATE TABLE IF NOT EXISTS obra_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_obra_annotations_obra ON obra_annotations(obra_id);
CREATE INDEX IF NOT EXISTS idx_obra_photos_obra ON obra_photos(obra_id);

-- Verify the tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('obra_annotations', 'obra_photos');
