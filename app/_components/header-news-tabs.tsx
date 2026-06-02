"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FALLBACK_NEWS_CATEGORIES,
  resolveActiveCategorySlug,
} from "@/lib/news-tabs";
import type { NewsCategoryRecord } from "@/lib/news-categories";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

/** 메인 네비 News 메뉴 라벨 */
const NEWS_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/news")?.label ?? "News";

/**
 * /news 목록 페이지 전용 서브 탭 (헤더 하단, 스크롤 시 상단 고정)
 * News | {동적 카테고리} — DB categories 기준
 */
export function HeaderNewsTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<
    Pick<NewsCategoryRecord, "id" | "name" | "slug">[]
  >(FALLBACK_NEWS_CATEGORIES);

  const isNewsListPage = pathname === "/news";

  const activeCategorySlug = resolveActiveCategorySlug(
    searchParams.get("category"),
    searchParams.get("tab"),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/news/categories");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      } catch {
        // 실패 시 FALLBACK 유지
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

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
  }, [isNewsListPage, categories.length]);

  if (!isNewsListPage) {
    return null;
  }

  const handleCategoryChange = (slug: string) => {
    if (slug === activeCategorySlug) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("tab");
    nextParams.set("category", slug);

    router.replace(`/news?${nextParams.toString()}`, { scroll: false });
  };

  const firstCategorySlug = categories[0]?.slug ?? null;
  const resolvedSlug =
    activeCategorySlug ?? firstCategorySlug ?? FALLBACK_NEWS_CATEGORIES[0].slug;

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

          {categories.map((category, index) => {
            const isActive = resolvedSlug === category.slug;

            return (
              <span key={category.id} className="inline-flex items-center gap-2">
                {index > 0 && (
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
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
