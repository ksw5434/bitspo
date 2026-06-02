import type { SportsCategoryRecord } from "@/lib/sports-categories";

/** 레거시 /sports?tab= 쿼리 (하위 호환) */
export type LegacySportsTab = "nba" | "nfl" | "mlb" | "golf";

export const LEGACY_SPORTS_TAB_LABELS: Record<LegacySportsTab, string> = {
  nba: "NBA",
  nfl: "NFL",
  mlb: "MLB",
  golf: "GOLF",
};

export const LEGACY_SPORTS_TABS: LegacySportsTab[] = ["nba", "nfl", "mlb", "golf"];

const VALID_LEGACY_TABS = new Set<LegacySportsTab>(LEGACY_SPORTS_TABS);

export function parseLegacySportsTab(tabParam: string | null): LegacySportsTab {
  if (tabParam && VALID_LEGACY_TABS.has(tabParam as LegacySportsTab)) {
    return tabParam as LegacySportsTab;
  }
  return "nba";
}

/** DB 카테고리 없을 때 기본 탭 */
export const FALLBACK_SPORTS_CATEGORIES: Pick<
  SportsCategoryRecord,
  "id" | "name" | "slug"
>[] = [
  { id: "fallback-nba", name: "NBA", slug: "nba" },
  { id: "fallback-nfl", name: "NFL", slug: "nfl" },
  { id: "fallback-mlb", name: "MLB", slug: "mlb" },
  { id: "fallback-golf", name: "GOLF", slug: "golf" },
];

/** 활성 스포츠 카테고리 slug (category 우선, 없으면 tab) */
export function resolveActiveSportsCategorySlug(
  categoryParam: string | null,
  tabParam: string | null,
  categories: Pick<SportsCategoryRecord, "slug">[],
): string {
  if (categoryParam?.trim()) {
    return categoryParam.trim();
  }

  if (tabParam && VALID_LEGACY_TABS.has(tabParam as LegacySportsTab)) {
    return tabParam;
  }

  return categories[0]?.slug ?? FALLBACK_SPORTS_CATEGORIES[0].slug;
}
