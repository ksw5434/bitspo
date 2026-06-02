import type { CommunityTab } from "@/lib/community-tabs";
import { GUESTBOOK_CATEGORY, isGuestbookPost } from "@/lib/community-tabs";

/** DB communities.section 값 */
export type CommunitySection = CommunityTab;

export const COMMUNITY_SECTIONS: CommunitySection[] = [
  "forum",
  "discussion",
  "guestbook",
];

export const COMMUNITY_SECTION_LABELS: Record<CommunitySection, string> = {
  forum: "Forum",
  discussion: "Discussion",
  guestbook: "Guestbook",
};

/** Discussion 글 카테고리 (관리자 작성 시 선택) */
export const DISCUSSION_TOPIC_CATEGORIES = [
  "비트코인",
  "이더리움",
  "솔라나",
  "디파이",
  "NFT",
  "메타버스",
  "알트코인",
  "거래소",
  "뉴스",
  "기타",
] as const;

const VALID_SECTIONS = new Set<string>(COMMUNITY_SECTIONS);

export function isCommunitySection(value: string): value is CommunitySection {
  return VALID_SECTIONS.has(value);
}

/** section 컬럼 없을 때 category 기반 추론 */
export function resolvePostSection(post: {
  section?: string | null;
  category?: string | null;
}): CommunitySection {
  if (post.section && isCommunitySection(post.section)) {
    return post.section;
  }
  if (isGuestbookPost(post.category)) {
    return "guestbook";
  }
  return "discussion";
}

export function sectionToGuestbookCategory(section: CommunitySection): string | null {
  return section === "guestbook" ? GUESTBOOK_CATEGORY : null;
}
