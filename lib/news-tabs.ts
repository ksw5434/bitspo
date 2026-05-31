/** /news 페이지 탭 타입 */
export type NewsTab = "sports" | "crypto";

export const NEWS_TAB_LABELS: Record<NewsTab, string> = {
  sports: "Sports News",
  crypto: "Crypto Insights",
};

/** URL 쿼리에서 탭 값 파싱 */
export function parseNewsTab(tabParam: string | null): NewsTab {
  return tabParam === "crypto" ? "crypto" : "sports";
}
