/** /sports 페이지 서브 탭 타입 */
export type SportsTab = "nba" | "nfl" | "mlb" | "golf";

export const SPORTS_TAB_LABELS: Record<SportsTab, string> = {
  nba: "NBA",
  nfl: "NFL",
  mlb: "MLB",
  golf: "GOLF",
};

export const SPORTS_TABS: SportsTab[] = ["nba", "nfl", "mlb", "golf"];

const VALID_SPORTS_TABS = new Set<SportsTab>(SPORTS_TABS);

/** URL 쿼리에서 스포츠 탭 값 파싱 (기본값: NBA) */
export function parseSportsTab(tabParam: string | null): SportsTab {
  if (tabParam && VALID_SPORTS_TABS.has(tabParam as SportsTab)) {
    return tabParam as SportsTab;
  }
  return "nba";
}
