-- ============================================
-- Supabase Storage 버킷 RLS 정책 설정
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행
-- 
-- 참고: Storage 버킷은 Supabase 대시보드의 Storage 메뉴에서 먼저 생성해야 합니다.
-- 버킷 이름: 'news-image'
-- 공개 버킷: Yes (Public bucket)

-- ============================================
-- 1. Storage 버킷 생성 (대시보드에서 수동으로 생성 필요)
-- ============================================
-- Supabase 대시보드 > Storage > New bucket
-- 이름: news-image
-- Public bucket: Yes (체크)

-- ============================================
-- 2. Storage 버킷 RLS 정책 설정
-- ============================================

-- 정책 1: 모든 사용자는 이미지를 조회할 수 있습니다 (공개 버킷이므로)
CREATE POLICY "Anyone can view news images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'news-image');

-- 정책 2: 관리자만 이미지를 업로드할 수 있습니다
CREATE POLICY "Only admins can upload news images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 정책 3: 관리자만 자신이 업로드한 이미지를 수정할 수 있습니다
CREATE POLICY "Only admins can update own news images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) AND
  -- 사용자 ID가 파일 경로에 포함되어 있는지 확인
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 4: 관리자만 자신이 업로드한 이미지를 삭제할 수 있습니다
CREATE POLICY "Only admins can delete own news images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) AND
  -- 사용자 ID가 파일 경로에 포함되어 있는지 확인
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 대안: 더 간단한 정책 (모든 관리자가 모든 이미지 수정/삭제 가능)
-- ============================================
-- 위의 정책 3, 4 대신 아래 정책을 사용할 수 있습니다:

-- CREATE POLICY "Only admins can update news images"
-- ON storage.objects
-- FOR UPDATE
-- USING (
--   bucket_id = 'news-image' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_admin = true
--   )
-- )
-- WITH CHECK (
--   bucket_id = 'news-image' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_admin = true
--   )
-- );

-- CREATE POLICY "Only admins can delete news images"
-- ON storage.objects
-- FOR DELETE
-- USING (
--   bucket_id = 'news-image' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_admin = true
--   )
-- );

-- ============================================
-- 정책 확인 쿼리
-- ============================================
-- Storage 버킷의 정책을 확인하려면:
-- SELECT * FROM storage.policies WHERE bucket_id = 'news-image';

-- ============================================
-- 정책 삭제 (필요시)
-- ============================================
-- DROP POLICY IF EXISTS "Anyone can view news images" ON storage.objects;
-- DROP POLICY IF EXISTS "Only admins can upload news images" ON storage.objects;
-- DROP POLICY IF EXISTS "Only admins can update own news images" ON storage.objects;
-- DROP POLICY IF EXISTS "Only admins can delete own news images" ON storage.objects;

