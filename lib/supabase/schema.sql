-- ============================================
-- 사용자 프로필 테이블 생성
-- ============================================

-- profiles 테이블 생성
-- auth.users 테이블과 1:1 관계로 연결됩니다
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS profiles_name_idx ON public.profiles(name);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);

-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 프로필을 조회할 수 있습니다
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 정책 2: 모든 사용자는 모든 프로필을 조회할 수 있습니다 (공개 프로필)
-- 필요에 따라 이 정책을 제거하고 위의 정책만 사용할 수 있습니다
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 정책 3: 사용자는 자신의 프로필을 생성할 수 있습니다
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 정책 4: 사용자는 자신의 프로필을 업데이트할 수 있습니다
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 정책 5: 사용자는 자신의 프로필을 삭제할 수 있습니다
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 업데이트 시간 자동 갱신 함수
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
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 사용자 생성 시 자동으로 프로필 생성하는 함수
-- ============================================

-- 새 사용자가 생성될 때 자동으로 프로필을 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 기존 사용자를 위한 프로필 생성 함수 (선택사항)
-- ============================================

-- 이미 존재하는 사용자들의 프로필을 생성하는 함수
-- Supabase 대시보드의 SQL Editor에서 한 번 실행하면 됩니다
CREATE OR REPLACE FUNCTION public.create_profiles_for_existing_users()
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', ''),
    COALESCE(raw_user_meta_data->>'avatar_url', NULL)
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 사용자 정보와 프로필을 조인한 뷰
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created_at,
  p.name,
  p.avatar_url,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- ============================================
-- 사용 예시 쿼리
-- ============================================

-- 현재 로그인한 사용자의 프로필 조회
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- 프로필 업데이트
-- UPDATE public.profiles 
-- SET name = '새 이름', avatar_url = 'https://example.com/avatar.jpg'
-- WHERE id = auth.uid();

-- 모든 공개 프로필 조회
-- SELECT id, name, avatar_url, created_at FROM public.profiles ORDER BY created_at DESC;

