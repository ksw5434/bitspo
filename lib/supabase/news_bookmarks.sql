-- ============================================
-- 뉴스 북마크 테이블 생성
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- news_bookmarks 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 뉴스당 하나의 북마크만 허용
  UNIQUE(news_id, user_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS news_bookmarks_news_id_idx ON public.news_bookmarks(news_id);
CREATE INDEX IF NOT EXISTS news_bookmarks_user_id_idx ON public.news_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS news_bookmarks_created_at_idx ON public.news_bookmarks(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 북마크만 조회할 수 있습니다
CREATE POLICY "Users can view own bookmarks"
  ON public.news_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책 2: 로그인한 사용자는 자신의 북마크를 생성할 수 있습니다
CREATE POLICY "Users can insert own bookmarks"
  ON public.news_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 북마크만 삭제할 수 있습니다
CREATE POLICY "Users can delete own bookmarks"
  ON public.news_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '북마크 테이블 설정이 완료되었습니다!';
END $$;

