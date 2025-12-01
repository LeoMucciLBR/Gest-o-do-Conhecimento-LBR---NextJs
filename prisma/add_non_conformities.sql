-- Create obra_non_conformities table
CREATE TABLE IF NOT EXISTS obra_non_conformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  km NUMERIC(10,3) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'BAIXA', -- BAIXA, MEDIA, ALTA, CRITICA
  status VARCHAR(50) DEFAULT 'ABERTA', -- ABERTA, EM_ANDAMENTO, RESOLVIDA
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create non_conformity_photos table
CREATE TABLE IF NOT EXISTS non_conformity_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL REFERENCES obra_non_conformities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nc_obra ON obra_non_conformities(obra_id);
CREATE INDEX IF NOT EXISTS idx_nc_photos ON non_conformity_photos(non_conformity_id);
