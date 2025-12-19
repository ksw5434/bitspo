-- ============================================
-- 리치 텍스트 에디터를 위한 뉴스 테이블 마이그레이션
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- 1. content 필드를 JSONB로 변경
-- 기존 TEXT 데이터는 JSON 형식으로 변환됩니다
ALTER TABLE public.news 
ALTER COLUMN content TYPE JSONB 
USING CASE 
  WHEN content IS NULL THEN NULL
  WHEN content = '' THEN '{}'::jsonb
  ELSE jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text', content)
    ))
  ))
END;

-- 2. (선택사항) 이미지 저장을 위한 별도 테이블 생성
-- TipTap 에디터에서 업로드한 이미지들을 관리합니다
CREATE TABLE IF NOT EXISTS public.news_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS news_images_news_id_idx ON public.news_images(news_id);
CREATE INDEX IF NOT EXISTS news_images_order_idx ON public.news_images(order_index);

-- RLS 정책 설정
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 이미지를 조회할 수 있습니다
CREATE POLICY "Anyone can view news images"
  ON public.news_images
  FOR SELECT
  USING (true);

-- 관리자만 이미지를 생성할 수 있습니다
CREATE POLICY "Only admins can insert news images"
  ON public.news_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자만 이미지를 수정할 수 있습니다
CREATE POLICY "Only admins can update news images"
  ON public.news_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자만 이미지를 삭제할 수 있습니다
CREATE POLICY "Only admins can delete news images"
  ON public.news_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 대안: HTML 저장 방식 (더 간단한 방법)
-- ============================================
-- content 필드를 TEXT로 유지하고 HTML을 저장하는 방법
-- 위의 JSONB 변경을 원하지 않는다면 이 방법을 사용하세요

-- ALTER TABLE public.news ALTER COLUMN content TYPE TEXT;
-- (변경 불필요, 이미 TEXT 타입)

