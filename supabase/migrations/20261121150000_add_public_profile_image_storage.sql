-- Public profile imagery is isolated from the private CV and verification-document bucket.
-- Only the owning authenticated user may upload, replace, or delete their own images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'abi-job-public-images',
  'abi-job-public-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Public profile images are viewable by everyone" ON storage.objects;
-- Public bucket downloads bypass object SELECT policies; leaving SELECT ungranted
-- prevents anonymous users from listing every object in the bucket.

DROP POLICY IF EXISTS "Users upload their own public profile images" ON storage.objects;
CREATE POLICY "Users upload their own public profile images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'abi-job-public-images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (storage.foldername(name))[1] IN ('avatars', 'employer-logos')
  );

DROP POLICY IF EXISTS "Users update their own public profile images" ON storage.objects;
CREATE POLICY "Users update their own public profile images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'abi-job-public-images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (storage.foldername(name))[1] IN ('avatars', 'employer-logos')
  )
  WITH CHECK (
    bucket_id = 'abi-job-public-images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (storage.foldername(name))[1] IN ('avatars', 'employer-logos')
  );

DROP POLICY IF EXISTS "Users delete their own public profile images" ON storage.objects;
CREATE POLICY "Users delete their own public profile images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'abi-job-public-images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (storage.foldername(name))[1] IN ('avatars', 'employer-logos')
  );
