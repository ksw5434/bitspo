-- ============================================
-- 커뮤니티 게시글 테이블 생성
-- ============================================
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- communities 테이블 생성
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  category TEXT, -- 카테고리 (비트코인, 이더리움, 솔라나 등)
  tags TEXT[] DEFAULT '{}', -- 태그 배열
  image_url TEXT, -- 게시글 이미지 URL
  views INTEGER DEFAULT 0 NOT NULL CHECK (views >= 0),
  like_count INTEGER DEFAULT 0 NOT NULL CHECK (like_count >= 0),
  comment_count INTEGER DEFAULT 0 NOT NULL CHECK (comment_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS communities_user_id_idx ON public.communities(user_id);
CREATE INDEX IF NOT EXISTS communities_category_idx ON public.communities(category);
CREATE INDEX IF NOT EXISTS communities_created_at_idx ON public.communities(created_at DESC);
CREATE INDEX IF NOT EXISTS communities_like_count_idx ON public.communities(like_count DESC);
CREATE INDEX IF NOT EXISTS communities_views_idx ON public.communities(views DESC);
-- 태그 배열 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS communities_tags_idx ON public.communities USING GIN(tags);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 커뮤니티 게시글을 조회할 수 있습니다
CREATE POLICY "Anyone can view communities"
  ON public.communities
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 게시글을 생성할 수 있습니다
CREATE POLICY "Users can insert own communities"
  ON public.communities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 게시글만 수정할 수 있습니다
CREATE POLICY "Users can update own communities"
  ON public.communities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 게시글만 삭제할 수 있습니다
CREATE POLICY "Users can delete own communities"
  ON public.communities
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_communities_updated_at ON public.communities;
CREATE TRIGGER set_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 커뮤니티 게시글 좋아요 테이블 생성
-- ============================================

-- community_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 게시글당 하나의 좋아요만 허용
  UNIQUE(community_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS community_likes_community_id_idx ON public.community_likes(community_id);
CREATE INDEX IF NOT EXISTS community_likes_user_id_idx ON public.community_likes(user_id);
CREATE INDEX IF NOT EXISTS community_likes_created_at_idx ON public.community_likes(created_at DESC);

-- RLS 활성화
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 게시글 좋아요를 조회할 수 있습니다
CREATE POLICY "Anyone can view community likes"
  ON public.community_likes
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 자신의 좋아요를 생성할 수 있습니다
CREATE POLICY "Users can insert own community likes"
  ON public.community_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 좋아요만 삭제할 수 있습니다
CREATE POLICY "Users can delete own community likes"
  ON public.community_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 게시글 좋아요 개수 자동 업데이트 함수 및 트리거
-- ============================================

-- 게시글 좋아요 개수를 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_community_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 좋아요 추가 시 개수 증가
    UPDATE public.communities
    SET like_count = like_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 좋아요 삭제 시 개수 감소
    UPDATE public.communities
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 추가 시 트리거
DROP TRIGGER IF EXISTS trigger_increment_community_like_count ON public.community_likes;
CREATE TRIGGER trigger_increment_community_like_count
  AFTER INSERT ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_like_count();

-- 좋아요 삭제 시 트리거
DROP TRIGGER IF EXISTS trigger_decrement_community_like_count ON public.community_likes;
CREATE TRIGGER trigger_decrement_community_like_count
  AFTER DELETE ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_like_count();

-- ============================================
-- 커뮤니티 댓글 테이블 생성
-- ============================================

-- community_comments 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  like_count INTEGER DEFAULT 0 NOT NULL CHECK (like_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS community_comments_community_id_idx ON public.community_comments(community_id);
CREATE INDEX IF NOT EXISTS community_comments_user_id_idx ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS community_comments_created_at_idx ON public.community_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS community_comments_like_count_idx ON public.community_comments(like_count DESC);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 커뮤니티 댓글을 조회할 수 있습니다
CREATE POLICY "Anyone can view community comments"
  ON public.community_comments
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 댓글을 생성할 수 있습니다
CREATE POLICY "Users can insert own community comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 댓글만 수정할 수 있습니다
CREATE POLICY "Users can update own community comments"
  ON public.community_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 댓글만 삭제할 수 있습니다
CREATE POLICY "Users can delete own community comments"
  ON public.community_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_community_comments_updated_at ON public.community_comments;
CREATE TRIGGER set_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 댓글 좋아요 테이블 생성
-- ============================================

-- community_comment_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 댓글당 하나의 좋아요만 허용
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS community_comment_likes_comment_id_idx ON public.community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS community_comment_likes_user_id_idx ON public.community_comment_likes(user_id);

-- RLS 활성화
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 댓글 좋아요를 조회할 수 있습니다
CREATE POLICY "Anyone can view comment likes"
  ON public.community_comment_likes
  FOR SELECT
  USING (true);

-- 정책 2: 로그인한 사용자는 자신의 좋아요를 생성할 수 있습니다
CREATE POLICY "Users can insert own comment likes"
  ON public.community_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 좋아요만 삭제할 수 있습니다
CREATE POLICY "Users can delete own comment likes"
  ON public.community_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 댓글 좋아요 개수 자동 업데이트 함수 및 트리거
-- ============================================

-- 댓글 좋아요 개수를 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_community_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 좋아요 추가 시 개수 증가
    UPDATE public.community_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 좋아요 삭제 시 개수 감소
    UPDATE public.community_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 추가 시 트리거
DROP TRIGGER IF EXISTS trigger_increment_community_comment_like_count ON public.community_comment_likes;
CREATE TRIGGER trigger_increment_community_comment_like_count
  AFTER INSERT ON public.community_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_comment_like_count();

-- 좋아요 삭제 시 트리거
DROP TRIGGER IF EXISTS trigger_decrement_community_comment_like_count ON public.community_comment_likes;
CREATE TRIGGER trigger_decrement_community_comment_like_count
  AFTER DELETE ON public.community_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_comment_like_count();

-- ============================================
-- 게시글 댓글 개수 자동 업데이트 함수 및 트리거
-- ============================================

-- 게시글 댓글 개수를 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_community_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 댓글 추가 시 개수 증가
    UPDATE public.communities
    SET comment_count = comment_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 댓글 삭제 시 개수 감소
    UPDATE public.communities
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 추가 시 트리거
DROP TRIGGER IF EXISTS trigger_increment_community_comment_count ON public.community_comments;
CREATE TRIGGER trigger_increment_community_comment_count
  AFTER INSERT ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_comment_count();

-- 댓글 삭제 시 트리거
DROP TRIGGER IF EXISTS trigger_decrement_community_comment_count ON public.community_comments;
CREATE TRIGGER trigger_decrement_community_comment_count
  AFTER DELETE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_comment_count();

-- ============================================
-- 커뮤니티 북마크 테이블 생성
-- ============================================

-- community_bookmarks 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- 사용자당 게시글당 하나의 북마크만 허용
  UNIQUE(community_id, user_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS community_bookmarks_community_id_idx ON public.community_bookmarks(community_id);
CREATE INDEX IF NOT EXISTS community_bookmarks_user_id_idx ON public.community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS community_bookmarks_created_at_idx ON public.community_bookmarks(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 북마크만 조회할 수 있습니다
CREATE POLICY "Users can view own bookmarks"
  ON public.community_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- 정책 2: 로그인한 사용자는 자신의 북마크를 생성할 수 있습니다
CREATE POLICY "Users can insert own bookmarks"
  ON public.community_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 북마크만 삭제할 수 있습니다
CREATE POLICY "Users can delete own bookmarks"
  ON public.community_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 조회수 증가 함수 (선택사항)
-- ============================================

-- 게시글 조회수를 증가시키는 함수
CREATE OR REPLACE FUNCTION public.increment_community_views(community_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.communities
  SET views = views + 1
  WHERE id = community_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 게시글별 좋아요 개수 집계 뷰
CREATE OR REPLACE VIEW public.community_like_counts AS
SELECT 
  community_id,
  COUNT(*) as count
FROM public.community_likes
GROUP BY community_id;

-- 게시글별 댓글 개수 집계 뷰
CREATE OR REPLACE VIEW public.community_comment_counts AS
SELECT 
  community_id,
  COUNT(*) as count
FROM public.community_comments
GROUP BY community_id;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '커뮤니티 테이블 설정이 완료되었습니다!';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - communities (게시글)';
  RAISE NOTICE '  - community_likes (게시글 좋아요)';
  RAISE NOTICE '  - community_comments (댓글)';
  RAISE NOTICE '  - community_comment_likes (댓글 좋아요)';
  RAISE NOTICE '  - community_bookmarks (북마크)';
END $$;

