"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SPORTS_TAB_LABELS,
  SPORTS_TABS,
  parseSportsTab,
  type SportsTab,
} from "@/lib/sports-tabs";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

/** 메인 네비 Sports 메뉴 라벨 */
const SPORTS_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/sports")?.label ?? "Sports";

/**
 * /sports 페이지 전용 서브 탭 (헤더 하단, 스크롤 시 상단 고정)
 * Sports | NBA | NFL | MLB | GOLF — 컨테이너 내 왼쪽 정렬, 파이프 구분
 */
export function HeaderSportsTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSportsPage = pathname === "/sports";

  // sticky 탭 바 높이 — 하위 sticky 요소 offset에 사용
  useEffect(() => {
    const tabsBarElement = tabsBarRef.current;
    if (!isSportsPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--sports-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--sports-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--sports-tabs-height");
    };
  }, [isSportsPage]);

  if (!isSportsPage) {
    return null;
  }

  const activeSportsTab = parseSportsTab(searchParams.get("tab"));

  const handleTabChange = (tab: SportsTab) => {
    if (tab === activeSportsTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "nba") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `/sports?${queryString}` : "/sports", {
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
          aria-label="스포츠 리그"
        >
          {/* 메인 Sports 메뉴 표시 */}
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
              {SPORTS_SECTION_LABEL}
            </span>
            <span
              className="text-muted-foreground/40 select-none"
              aria-hidden
            >
              |
            </span>
          </span>

          {SPORTS_TABS.map((tab, tabIndex) => (
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
                aria-selected={activeSportsTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap transition-colors cursor-pointer ${
                  activeSportsTab === tab
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {SPORTS_TAB_LABELS[tab]}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
