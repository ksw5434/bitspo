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

/** /bet 탭별 안내 문구 (목업) */
export const BET_TAB_DESCRIPTIONS: Record<BetTab, string> = {
  "how-to-bet":
    "베팅 방법, 오즈 읽기, 자금 관리 등 초보자를 위한 단계별 가이드를 준비 중입니다.",
  "betting-sites":
    "스포츠·크립토 베팅 사이트 비교와 보너스 정보를 곧 제공할 예정입니다.",
};
