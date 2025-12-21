-- ============================================
-- 프로필 아바타 이미지 Storage 버킷 RLS 정책 설정
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행
-- 
-- 참고: Storage 버킷은 Supabase 대시보드의 Storage 메뉴에서 먼저 생성해야 합니다.
-- 버킷 이름: 'avatars' 또는 'profile-images'
-- 공개 버킷: Yes (Public bucket)

-- ============================================
-- 1. Storage 버킷 생성 (대시보드에서 수동으로 생성 필요)
-- ============================================
-- Supabase 대시보드 > Storage > New bucket
-- 이름: avatars
-- Public bucket: Yes (체크)

-- ============================================
-- 2. Storage 버킷 RLS 정책 설정
-- ============================================

-- 정책 1: 모든 사용자는 아바타 이미지를 조회할 수 있습니다 (공개 버킷)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 정책 2: 모든 로그인한 사용자는 자신의 아바타를 업로드할 수 있습니다
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  -- 사용자 ID가 파일 경로에 포함되어 있는지 확인
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 3: 사용자는 자신의 아바타만 수정할 수 있습니다
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 4: 사용자는 자신의 아바타만 삭제할 수 있습니다
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

