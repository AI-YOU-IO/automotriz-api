-- Migración: Agregar campos Ultravox a llamada y transcripcion
-- Ejecutar contra la base de datos PostgreSQL de viva-api

-- ============================================
-- TABLA: llamada
-- ============================================

-- Cambiar provider_call_id de INTEGER a VARCHAR(100) con UNIQUE
ALTER TABLE llamada ALTER COLUMN provider_call_id TYPE VARCHAR(100);
ALTER TABLE llamada ALTER COLUMN provider_call_id DROP NOT NULL;
ALTER TABLE llamada ADD CONSTRAINT llamada_provider_call_id_unique UNIQUE (provider_call_id);

-- Permitir nulls en campos que antes eran obligatorios (para llamadas creadas por webhook)
ALTER TABLE llamada ALTER COLUMN fecha_inicio DROP NOT NULL;
ALTER TABLE llamada ALTER COLUMN id_estado_llamada DROP NOT NULL;
ALTER TABLE llamada ALTER COLUMN id_prospecto DROP NOT NULL;

-- Agregar campos Ultravox
ALTER TABLE llamada ADD COLUMN IF NOT EXISTS id_ultravox_call VARCHAR(100);
ALTER TABLE llamada ADD COLUMN IF NOT EXISTS metadata_ultravox_call JSONB;

-- ============================================
-- TABLA: transcripcion
-- ============================================

-- Agregar campos para transcripción de Ultravox
ALTER TABLE transcripcion ADD COLUMN IF NOT EXISTS speaker_role VARCHAR(20);
ALTER TABLE transcripcion ADD COLUMN IF NOT EXISTS ordinal INTEGER;

-- Permitir null en usuario_actualizacion (webhook no tiene usuario)
ALTER TABLE transcripcion ALTER COLUMN usuario_actualizacion DROP NOT NULL;
