-- ==============================================================================
-- Migración: Bucket de Almacenamiento para Media (WorkIn)
-- Habilita subida y lectura pública de fotos de perfil, portadas de servicio y adjuntos
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];

-- Políticas de Seguridad RLS sobre storage.objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Media Read'
  ) THEN
    CREATE POLICY "Public Media Read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Media Upload'
  ) THEN
    CREATE POLICY "Authenticated Media Upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Media Update'
  ) THEN
    CREATE POLICY "Authenticated Media Update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Media Delete'
  ) THEN
    CREATE POLICY "Authenticated Media Delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'media');
  END IF;
END $$;
