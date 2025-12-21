-- ============================================
-- 비트스포 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- ============================================
-- 1. 사용자 프로필 테이블 생성
-- ============================================

-- profiles 테이블 생성 (없으면 생성)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기자 정보 필드 추가 (기존 테이블이 있는 경우를 위해)
DO $$ 
BEGIN
  -- position 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN position TEXT;
  END IF;

  -- bio 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  -- affiliation 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'affiliation'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN affiliation TEXT;
  END IF;

  -- social_links 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'social_links'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- is_admin 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS profiles_name_idx ON public.profiles(name);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_position_idx ON public.profiles(position);
CREATE INDEX IF NOT EXISTS profiles_affiliation_idx ON public.profiles(affiliation);
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin);

-- ============================================
-- 2. Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (중복 방지)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 3. 업데이트 시간 자동 갱신 함수
-- ============================================

-- updated_at 컬럼을 자동으로 갱신하는 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. 사용자 생성 시 자동으로 프로필 생성하는 함수
-- ============================================

-- 새 사용자가 생성될 때 자동으로 프로필을 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, position, bio, affiliation, social_links, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NULL, -- position은 회원가입 후 대시보드에서 입력
    NULL, -- bio는 회원가입 후 대시보드에서 입력
    NULL, -- affiliation은 회원가입 후 대시보드에서 입력
    '{}'::jsonb, -- social_links는 회원가입 후 대시보드에서 입력
    FALSE -- 기본값은 일반 사용자
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 시 프로필 자동 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. 기존 사용자를 위한 프로필 생성 함수
-- ============================================

-- 이미 존재하는 사용자들의 프로필을 생성하는 함수
CREATE OR REPLACE FUNCTION public.create_profiles_for_existing_users()
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, position, bio, affiliation, social_links, is_admin)
  SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', ''),
    COALESCE(raw_user_meta_data->>'avatar_url', NULL),
    NULL, -- position은 회원가입 후 대시보드에서 입력
    NULL, -- bio는 회원가입 후 대시보드에서 입력
    NULL, -- affiliation은 회원가입 후 대시보드에서 입력
    '{}'::jsonb, -- social_links는 회원가입 후 대시보드에서 입력
    FALSE -- 기본값은 일반 사용자
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 유용한 뷰 생성
-- ============================================

-- 사용자 정보와 프로필을 조인한 뷰
-- 기존 뷰가 있으면 삭제 후 재생성 (컬럼 변경 시 필요)
DROP VIEW IF EXISTS public.user_profiles;
CREATE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created_at,
  p.name,
  p.avatar_url,
  p.position,
  p.bio,
  p.affiliation,
  p.social_links,
  p.is_admin,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- ============================================
-- 7. 뉴스 테이블 생성
-- ============================================

-- news 테이블 생성
CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS news_author_id_idx ON public.news(author_id);

-- ============================================
-- 8. 뉴스 테이블 RLS 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (중복 방지)
DROP POLICY IF EXISTS "Anyone can view news" ON public.news;
CREATE POLICY "Anyone can view news"
  ON public.news
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can insert news" ON public.news;
CREATE POLICY "Only admins can insert news"
  ON public.news
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update news" ON public.news;
CREATE POLICY "Only admins can update news"
  ON public.news
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

DROP POLICY IF EXISTS "Only admins can delete news" ON public.news;
CREATE POLICY "Only admins can delete news"
  ON public.news
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 뉴스 테이블의 updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_news_updated_at ON public.news;
CREATE TRIGGER set_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '스키마 설정이 완료되었습니다!';
  RAISE NOTICE '기존 사용자 프로필을 생성하려면 다음을 실행하세요:';
  RAISE NOTICE 'SELECT public.create_profiles_for_existing_users();';
END $$;
