-- ============================================
-- 기자 정보 필드 추가 마이그레이션
-- ============================================

-- profiles 테이블에 기자 정보 필드 추가
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS position TEXT, -- 직책 (예: 수석 기자, 기자, 편집장 등)
  ADD COLUMN IF NOT EXISTS bio TEXT, -- 자기소개
  ADD COLUMN IF NOT EXISTS affiliation TEXT, -- 소속 (예: 비트스포, 블록체인 뉴스 등)
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb; -- SNS 링크 (JSON 형태로 저장)

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS profiles_position_idx ON public.profiles(position);
CREATE INDEX IF NOT EXISTS profiles_affiliation_idx ON public.profiles(affiliation);

-- 코멘트: social_links는 다음과 같은 형태로 저장됩니다:
-- {
--   "twitter": "https://twitter.com/username",
--   "linkedin": "https://linkedin.com/in/username",
--   "github": "https://github.com/username"
-- }

