"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BET_TAB_LABELS,
  BET_TABS,
  parseBetTab,
  type BetTab,
} from "@/lib/bet-tabs";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

/** 메인 네비 Bet 메뉴 라벨 */
const BET_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/bet")?.label ?? "Bet";

/**
 * /bet 페이지 전용 서브 탭 (헤더 하단, 스크롤 시 상단 고정)
 * Bet | Betting Sites | How to Bet — 컨테이너 내 왼쪽 정렬
 */
export function HeaderBetTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isBetPage = pathname === "/bet";

  // sticky 탭 바 높이 — 하위 sticky 요소 offset에 사용
  useEffect(() => {
    const tabsBarElement = tabsBarRef.current;
    if (!isBetPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--bet-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--bet-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--bet-tabs-height");
    };
  }, [isBetPage]);

  if (!isBetPage) {
    return null;
  }

  const activeBetTab = parseBetTab(searchParams.get("tab"));

  const handleTabChange = (tab: BetTab) => {
    if (tab === activeBetTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "betting-sites") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `/bet?${queryString}` : "/bet", {
      scroll: false,
    });
  };

  return (
    <div
      ref={tabsBarRef}
      className="sticky top-0 z-50 w-full border-y border-border bg-card/95 backdrop-blur-sm"
    >
      <div className="container w-full px-2 py-1.5">
        <div
          className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-base"
          role="tablist"
          aria-label="Bet 카테고리"
        >
          {/* 메인 Bet 메뉴 표시 */}
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
              {BET_SECTION_LABEL}
            </span>
            <span
              className="text-muted-foreground/40 select-none"
              aria-hidden
            >
              |
            </span>
          </span>

          {BET_TABS.map((tab, tabIndex) => (
            <span key={tab} className="inline-flex items-center gap-2">
              {tabIndex > 0 && (
                <span
                  className="text-muted-foreground/40 select-none"
                  aria-hidden
                >
                  |
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={activeBetTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap transition-colors cursor-pointer ${
                  activeBetTab === tab
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {BET_TAB_LABELS[tab]}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
