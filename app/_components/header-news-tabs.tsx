"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  NEWS_TAB_LABELS,
  parseNewsTab,
  type NewsTab,
} from "@/lib/news-tabs";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

const NEWS_TABS: NewsTab[] = ["sports", "crypto"];

/** 메인 네비 News 메뉴 라벨 */
const NEWS_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/news")?.label ?? "News";

/**
 * /news 목록 페이지 전용 서브 탭 (헤더 하단, 스크롤 시 상단 고정)
 * News | Sports News | Crypto Insights — 컨테이너 내 왼쪽 정렬
 */
export function HeaderNewsTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 뉴스 상세(/news/[id])에서는 표시하지 않음
  const isNewsListPage = pathname === "/news";

  // sticky 탭 바 높이 — 사이드바 등 하위 sticky 요소 offset에 사용
  useEffect(() => {
    const tabsBarElement = tabsBarRef.current;
    if (!isNewsListPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--news-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--news-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--news-tabs-height");
    };
  }, [isNewsListPage]);

  if (!isNewsListPage) {
    return null;
  }

  const activeNewsTab = parseNewsTab(searchParams.get("tab"));

  const handleTabChange = (tab: NewsTab) => {
    if (tab === activeNewsTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "sports") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `/news?${queryString}` : "/news", {
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
          aria-label="뉴스 카테고리"
        >
          {/* 메인 News 메뉴 표시 */}
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
              {NEWS_SECTION_LABEL}
            </span>
            <span
              className="text-muted-foreground/40 select-none"
              aria-hidden
            >
              |
            </span>
          </span>

          {NEWS_TABS.map((tab, tabIndex) => (
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
                aria-selected={activeNewsTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap transition-colors cursor-pointer ${
                  activeNewsTab === tab
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {NEWS_TAB_LABELS[tab]}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
