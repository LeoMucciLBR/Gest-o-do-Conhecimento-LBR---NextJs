-- Migration: Add COVER_IMAGE to document_kind enum
-- Date: 2025-11-26
-- Description: Adds COVER_IMAGE value to document_kind enum to support storing contract cover images

-- Add new enum value
ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'COVER_IMAGE';

-- Verify the change
-- SELECT unnest(enum_range(NULL::document_kind)) AS document_kinds;
