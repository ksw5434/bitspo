"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FALLBACK_SPORTS_CATEGORIES,
  resolveActiveSportsCategorySlug,
} from "@/lib/sports-tabs";
import type { SportsCategoryRecord } from "@/lib/sports-categories";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

const SPORTS_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/sports")?.label ?? "Sports";

/**
 * /sports 페이지 서브 탭 — sports_categories DB 기준 (동적)
 */
export function HeaderSportsTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<
    Pick<SportsCategoryRecord, "id" | "name" | "slug">[]
  >(FALLBACK_SPORTS_CATEGORIES);

  const isSportsPage = pathname === "/sports";

  const activeSlug = resolveActiveSportsCategorySlug(
    searchParams.get("category"),
    searchParams.get("tab"),
    categories,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/sports/categories");
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      } catch {
        // FALLBACK 유지
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

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
  }, [isSportsPage, categories.length]);

  if (!isSportsPage) {
    return null;
  }

  const handleCategoryChange = (slug: string) => {
    if (slug === activeSlug) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("tab");
    nextParams.set("category", slug);

    router.replace(`/sports?${nextParams.toString()}`, { scroll: false });
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
          aria-label="스포츠 카테고리"
        >
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

          {categories.map((category, index) => {
            const isActive = activeSlug === category.slug;

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
