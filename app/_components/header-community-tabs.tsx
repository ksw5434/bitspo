"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  COMMUNITY_TAB_LABELS,
  COMMUNITY_TABS,
  parseCommunityTab,
  type CommunityTab,
} from "@/lib/community-tabs";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

/** 메인 네비 Community 메뉴 라벨 */
const COMMUNITY_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/community")?.label ??
  "Community";

/**
 * /community 목록 페이지 전용 서브 탭 (헤더 하단, 스크롤 시 상단 고정)
 * Community | Forum | Discussion | Guestbook — 컨테이너 내 왼쪽 정렬
 */
export function HeaderCommunityTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 커뮤니티 목록 페이지만 표시 (상세·글쓰기 등 제외)
  const isCommunityListPage = pathname === "/community";

  useEffect(() => {
    const tabsBarElement = tabsBarRef.current;
    if (!isCommunityListPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--community-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--community-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--community-tabs-height");
    };
  }, [isCommunityListPage]);

  if (!isCommunityListPage) {
    return null;
  }

  const activeCommunityTab = parseCommunityTab(searchParams.get("tab"));

  const handleTabChange = (tab: CommunityTab) => {
    if (tab === activeCommunityTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "discussion") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `/community?${queryString}` : "/community", {
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
          aria-label="Community 카테고리"
        >
          {/* 메인 Community 메뉴 표시 */}
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
              {COMMUNITY_SECTION_LABEL}
            </span>
            <span
              className="text-muted-foreground/40 select-none"
              aria-hidden
            >
              |
            </span>
          </span>

          {COMMUNITY_TABS.map((tab, tabIndex) => (
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
                aria-selected={activeCommunityTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap transition-colors cursor-pointer ${
                  activeCommunityTab === tab
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {COMMUNITY_TAB_LABELS[tab]}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
