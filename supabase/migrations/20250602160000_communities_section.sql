-- 커뮤니티 섹션: forum | discussion | guestbook
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS section text;

UPDATE communities
SET section = 'guestbook'
WHERE section IS NULL
  AND (category = 'Guestbook' OR lower(trim(category)) = 'guestbook');

UPDATE communities
SET section = 'discussion'
WHERE section IS NULL;

ALTER TABLE communities
  ALTER COLUMN section SET DEFAULT 'discussion';

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_section_check;

ALTER TABLE communities
  ADD CONSTRAINT communities_section_check
  CHECK (section IN ('forum', 'discussion', 'guestbook'));

CREATE INDEX IF NOT EXISTS idx_communities_section_created
  ON communities (section, created_at DESC);

COMMENT ON COLUMN communities.section IS 'forum/discussion: 관리자 작성, guestbook: 회원 작성';
