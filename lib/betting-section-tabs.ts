/** Betting Sites / How to Bet 공통 서브 탭 타입 */
export type BettingSectionTab = "how-to-bet" | "betting-sites";

export const BETTING_SECTION_TAB_LABELS: Record<BettingSectionTab, string> = {
  "how-to-bet": "How to Bet",
  "betting-sites": "Betting Sites",
};

export const BETTING_SECTION_TABS: BettingSectionTab[] = [
  "betting-sites",
  "how-to-bet",
];

const VALID_BETTING_SECTION_TABS = new Set<BettingSectionTab>(
  BETTING_SECTION_TABS,
);

/** URL 쿼리에서 서브 탭 값 파싱 (기본값: Betting Sites) */
export function parseBettingSectionTab(
  tabParam: string | null,
): BettingSectionTab {
  if (tabParam && VALID_BETTING_SECTION_TABS.has(tabParam as BettingSectionTab)) {
    return tabParam as BettingSectionTab;
  }
  return "betting-sites";
}
