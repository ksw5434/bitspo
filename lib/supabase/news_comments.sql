-- ============================================
-- 뉴스 댓글 테이블 생성
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- news_comments 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  like_count INTEGER DEFAULT 0 NOT NULL CHECK (like_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS news_comments_news_id_idx ON public.news_comments(news_id);
CREATE INDEX IF NOT EXISTS news_comments_user_id_idx ON public.news_comments(user_id);
CREATE INDEX IF NOT EXISTS news_comments_created_at_idx ON public.news_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS news_comments_like_count_idx ON public.news_comments(like_count DESC);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 뉴스의 댓글을 조회할 수 있습니다
CREATE POLICY "Anyone can view news comments"
  ON public.news_comments
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 댓글을 생성할 수 있습니다
CREATE POLICY "Users can insert own comments"
  ON public.news_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 댓글만 수정할 수 있습니다
CREATE POLICY "Users can update own comments"
  ON public.news_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 댓글만 삭제할 수 있습니다
CREATE POLICY "Users can delete own comments"
  ON public.news_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_news_comments_updated_at ON public.news_comments;
CREATE TRIGGER set_news_comments_updated_at
  BEFORE UPDATE ON public.news_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 댓글 좋아요 테이블 생성 (선택사항 - 공감순 정렬을 위해)
-- ============================================

-- news_comment_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.news_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 댓글당 하나의 좋아요만 허용
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS news_comment_likes_comment_id_idx ON public.news_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS news_comment_likes_user_id_idx ON public.news_comment_likes(user_id);

-- RLS 활성화
ALTER TABLE public.news_comment_likes ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 댓글 좋아요를 조회할 수 있습니다
CREATE POLICY "Anyone can view comment likes"
  ON public.news_comment_likes
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 자신의 좋아요를 생성할 수 있습니다
CREATE POLICY "Users can insert own comment likes"
  ON public.news_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 좋아요만 삭제할 수 있습니다
CREATE POLICY "Users can delete own comment likes"
  ON public.news_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 댓글 좋아요 개수 자동 업데이트 함수 및 트리거
-- ============================================

-- 댓글 좋아요 개수를 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 좋아요 추가 시 개수 증가
    UPDATE public.news_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 좋아요 삭제 시 개수 감소
    UPDATE public.news_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 추가 시 트리거
DROP TRIGGER IF EXISTS trigger_increment_comment_like_count ON public.news_comment_likes;
CREATE TRIGGER trigger_increment_comment_like_count
  AFTER INSERT ON public.news_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_like_count();

-- 좋아요 삭제 시 트리거
DROP TRIGGER IF EXISTS trigger_decrement_comment_like_count ON public.news_comment_likes;
CREATE TRIGGER trigger_decrement_comment_like_count
  AFTER DELETE ON public.news_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_like_count();

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 뉴스별 댓글 개수 집계 뷰
CREATE OR REPLACE VIEW public.news_comment_counts AS
SELECT 
  news_id,
  COUNT(*) as count
FROM public.news_comments
GROUP BY news_id;

