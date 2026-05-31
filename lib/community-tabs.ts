/** /community 페이지 서브 탭 타입 */
export type CommunityTab = "forum" | "discussion" | "guestbook";

export const COMMUNITY_TAB_LABELS: Record<CommunityTab, string> = {
  forum: "Forum",
  discussion: "Discussion",
  guestbook: "Guestbook",
};

export const COMMUNITY_TABS: CommunityTab[] = [
  "forum",
  "discussion",
  "guestbook",
];

/** 방명록 게시글 구분용 카테고리 값 (DB 저장) */
export const GUESTBOOK_CATEGORY = "Guestbook";

/** 탭별 안내 문구 (목업) */
export const COMMUNITY_TAB_DESCRIPTIONS: Record<CommunityTab, string> = {
  forum: "포럼 기능을 곧 제공할 예정입니다.",
  discussion: "자유롭게 글을 작성하고 암호화폐 관련 정보를 공유하세요.",
  guestbook: "짧은 메시지를 남기는 방명록 공간입니다. (텍스트만 작성 가능)",
};

const VALID_COMMUNITY_TABS = new Set<CommunityTab>(COMMUNITY_TABS);

/** 방명록 게시글 여부 */
export function isGuestbookPost(category: string | null | undefined): boolean {
  return category === GUESTBOOK_CATEGORY;
}

/** 탭별 게시글 필터 */
export function filterPostsByCommunityTab<
  T extends { category?: string | null },
>(posts: T[], tab: CommunityTab): T[] {
  if (tab === "guestbook") {
    return posts.filter((post) => isGuestbookPost(post.category));
  }
  if (tab === "discussion") {
    return posts.filter((post) => !isGuestbookPost(post.category));
  }
  return [];
}

/** URL 쿼리에서 Community 탭 값 파싱 (기본값: Discussion) */
export function parseCommunityTab(tabParam: string | null): CommunityTab {
  if (tabParam && VALID_COMMUNITY_TABS.has(tabParam as CommunityTab)) {
    return tabParam as CommunityTab;
  }
  return "discussion";
}
