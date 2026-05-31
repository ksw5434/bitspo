/**
 * 메인 네비게이션 메뉴 (헤더·푸터 공통)
 */
export const MAIN_NAV_ITEMS = [
  { label: "News", path: "/news" },
  { label: "Sports", path: "/sports" },
  { label: "Crypto", path: "/crypto" },
  { label: "Bet", path: "/bet" },
  { label: "Community", path: "/community" },
] as const;

export type MainNavItem = (typeof MAIN_NAV_ITEMS)[number];
