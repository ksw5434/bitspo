-- ============================================
-- 뉴스 카테고리 테이블 생성
-- ============================================

-- categories 테이블 생성
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 카테고리 이름 (PICK, 랭킹, 비트스포, 실시간)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);

-- ============================================
-- 뉴스-카테고리 관계 테이블 생성 (다대다 관계)
-- ============================================

-- news_categories 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 중복 방지: 같은 뉴스에 같은 카테고리는 한 번만 연결 가능
  UNIQUE(news_id, category_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS news_categories_news_id_idx ON public.news_categories(news_id);
CREATE INDEX IF NOT EXISTS news_categories_category_id_idx ON public.news_categories(category_id);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- categories 테이블 RLS 활성화
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 카테고리를 조회할 수 있습니다
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- 정책 2: 관리자만 카테고리를 생성할 수 있습니다
CREATE POLICY "Only admins can insert categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 3: 관리자만 카테고리를 수정할 수 있습니다
CREATE POLICY "Only admins can update categories"
  ON public.categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 4: 관리자만 카테고리를 삭제할 수 있습니다
CREATE POLICY "Only admins can delete categories"
  ON public.categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- news_categories 테이블 RLS 활성화
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 뉴스-카테고리 관계를 조회할 수 있습니다
CREATE POLICY "Anyone can view news categories"
  ON public.news_categories
  FOR SELECT
  USING (true);

-- 정책 2: 관리자만 뉴스-카테고리 관계를 생성할 수 있습니다
CREATE POLICY "Only admins can insert news categories"
  ON public.news_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 3: 관리자만 뉴스-카테고리 관계를 수정할 수 있습니다
CREATE POLICY "Only admins can update news categories"
  ON public.news_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 정책 4: 관리자만 뉴스-카테고리 관계를 삭제할 수 있습니다
CREATE POLICY "Only admins can delete news categories"
  ON public.news_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 카테고리 테이블의 updated_at 자동 갱신 트리거
-- ============================================

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 초기 카테고리 데이터 삽입
-- ============================================

-- 기존 카테고리가 없을 때만 삽입
INSERT INTO public.categories (name)
VALUES 
  ('PICK'),
  ('랭킹'),
  ('비트스포'),
  ('실시간')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 뉴스와 카테고리를 조인한 뷰
CREATE OR REPLACE VIEW public.news_with_categories AS
SELECT 
  n.id,
  n.headline,
  n.content,
  n.image_url,
  n.author_id,
  n.created_at,
  n.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) as categories
FROM public.news n
LEFT JOIN public.news_categories nc ON n.id = nc.news_id
LEFT JOIN public.categories c ON nc.category_id = c.id
GROUP BY n.id, n.headline, n.content, n.image_url, n.author_id, n.created_at, n.updated_at;

-- ============================================
-- 사용 예시 쿼리
-- ============================================

-- 모든 카테고리 조회
-- SELECT * FROM public.categories ORDER BY name;

-- 특정 뉴스의 카테고리 조회
-- SELECT c.* 
-- FROM public.categories c
-- JOIN public.news_categories nc ON c.id = nc.category_id
-- WHERE nc.news_id = '뉴스ID';

-- 카테고리별 뉴스 조회
-- SELECT n.* 
-- FROM public.news n
-- JOIN public.news_categories nc ON n.id = nc.news_id
-- JOIN public.categories c ON nc.category_id = c.id
-- WHERE c.name = 'PICK'
-- ORDER BY n.created_at DESC;

-- 뉴스와 카테고리를 함께 조회 (뷰 사용)
-- SELECT * FROM public.news_with_categories ORDER BY created_at DESC;


