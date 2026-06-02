import type { BetCategoryRecord } from "@/lib/bet-categories";
import {
  BETTING_SECTION_TABS,
  BETTING_SECTION_TAB_LABELS,
  parseBettingSectionTab,
  type BettingSectionTab,
} from "@/lib/betting-section-tabs";

export type BetTab = BettingSectionTab;

export const BET_TAB_LABELS = BETTING_SECTION_TAB_LABELS;
export const BET_TABS = BETTING_SECTION_TABS;
export const parseBetTab = parseBettingSectionTab;

/** DB 카테고리 없을 때 기본 탭 (기존 /bet 서브탭과 동일 slug) */
export const FALLBACK_BET_CATEGORIES: Pick<
  BetCategoryRecord,
  "id" | "name" | "slug"
>[] = [
  { id: "fallback-betting-sites", name: "Betting Sites", slug: "betting-sites" },
  { id: "fallback-how-to-bet", name: "How to Bet", slug: "how-to-bet" },
];

/** 활성 Bet 카테고리 slug (category 우선, 레거시 tab 호환) */
export function resolveActiveBetCategorySlug(
  categoryParam: string | null,
  tabParam: string | null,
  categories: Pick<BetCategoryRecord, "slug">[],
): string {
  if (categoryParam?.trim()) {
    return categoryParam.trim();
  }

  if (tabParam) {
    return parseBettingSectionTab(tabParam);
  }

  return categories[0]?.slug ?? FALLBACK_BET_CATEGORIES[0].slug;
}

/** /bet 탭별 안내 문구 */
export const BET_TAB_DESCRIPTIONS: Record<BetTab, string> = {
  "how-to-bet":
    "베팅 방법, 오즈 읽기, 자금 관리 등 초보자를 위한 가이드 글을 확인하세요.",
  "betting-sites":
    "스포츠·크립토 베팅 사이트 비교와 관련 뉴스를 확인하세요.",
};
