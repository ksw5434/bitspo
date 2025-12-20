# Supabase Storage 버킷 설정 가이드

## 문제 해결: "new row violates row-level security policy" 에러

이 에러는 Supabase Storage 버킷의 RLS (Row Level Security) 정책이 설정되지 않아서 발생합니다.

## 해결 방법

### 1단계: Storage 버킷 생성 (아직 생성하지 않은 경우)

1. Supabase 대시보드에 로그인
2. 왼쪽 메뉴에서 **Storage** 클릭
3. **New bucket** 버튼 클릭
4. 다음 정보 입력:
   - **Name**: `news-image`
   - **Public bucket**: ✅ **체크** (공개 버킷으로 설정)
5. **Create bucket** 클릭

### 2단계: Storage 버킷 RLS 정책 설정

Supabase 대시보드의 **SQL Editor**에서 다음 SQL을 실행하세요:

```sql
-- ============================================
-- Storage 버킷 RLS 정책 설정
-- ============================================

-- 정책 1: 모든 사용자는 이미지를 조회할 수 있습니다 (공개 버킷)
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

-- 정책 3: 관리자만 이미지를 수정할 수 있습니다
CREATE POLICY "Only admins can update news images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 정책 4: 관리자만 이미지를 삭제할 수 있습니다
CREATE POLICY "Only admins can delete news images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'news-image' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

### 3단계: 정책 확인

정책이 제대로 설정되었는지 확인:

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'news-image';
```

### 4단계: 테스트

1. 관리자 계정으로 로그인
2. 뉴스 작성 페이지에서 이미지를 드래그 앤 드롭
3. 업로드가 성공하는지 확인

## 문제 해결 체크리스트

- [ ] Storage 버킷 `news-image`가 생성되었는가?
- [ ] 버킷이 Public으로 설정되었는가?
- [ ] RLS 정책이 설정되었는가?
- [ ] 현재 사용자가 관리자 권한(`is_admin = true`)을 가지고 있는가?

## 기존 정책 삭제 (필요시)

정책을 다시 설정하려면 기존 정책을 먼저 삭제하세요:

```sql
DROP POLICY IF EXISTS "Anyone can view news images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update news images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete news images" ON storage.objects;
```

## 참고사항

- Storage 버킷의 RLS는 `storage.objects` 테이블에 대한 정책입니다
- 공개 버킷으로 설정하면 조회는 자동으로 허용되지만, 업로드/수정/삭제는 정책이 필요합니다
- 파일 경로는 `{user_id}/{timestamp}-{random}.{ext}` 형식으로 저장됩니다


