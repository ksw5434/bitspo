-- ============================================
-- 뉴스 반응 이모지 테이블 생성
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- news_reactions 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'sad', 'angry', 'surprised', 'anxious')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 뉴스당 하나의 반응만 허용
  UNIQUE(news_id, user_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS news_reactions_news_id_idx ON public.news_reactions(news_id);
CREATE INDEX IF NOT EXISTS news_reactions_user_id_idx ON public.news_reactions(user_id);
CREATE INDEX IF NOT EXISTS news_reactions_reaction_type_idx ON public.news_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS news_reactions_created_at_idx ON public.news_reactions(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 뉴스의 반응을 조회할 수 있습니다
CREATE POLICY "Anyone can view news reactions"
  ON public.news_reactions
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 자신의 반응을 생성할 수 있습니다
CREATE POLICY "Users can insert own reactions"
  ON public.news_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 반응만 수정할 수 있습니다
CREATE POLICY "Users can update own reactions"
  ON public.news_reactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 반응만 삭제할 수 있습니다
CREATE POLICY "Users can delete own reactions"
  ON public.news_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_news_reactions_updated_at ON public.news_reactions;
CREATE TRIGGER set_news_reactions_updated_at
  BEFORE UPDATE ON public.news_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 뉴스별 반응 개수 집계 뷰
CREATE OR REPLACE VIEW public.news_reaction_counts AS
SELECT 
  news_id,
  reaction_type,
  COUNT(*) as count
FROM public.news_reactions
GROUP BY news_id, reaction_type;

