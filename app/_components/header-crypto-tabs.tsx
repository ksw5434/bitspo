"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FALLBACK_CRYPTO_CATEGORIES,
  resolveActiveCryptoCategorySlug,
} from "@/lib/crypto-tabs";
import type { CryptoCategoryRecord } from "@/lib/crypto-categories";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

const CRYPTO_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/crypto")?.label ?? "Crypto";

/**
 * /crypto 페이지 서브 탭 — crypto_categories DB 기준 (동적)
 */
export function HeaderCryptoTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<
    Pick<CryptoCategoryRecord, "id" | "name" | "slug">[]
  >(FALLBACK_CRYPTO_CATEGORIES);

  const isCryptoPage = pathname === "/crypto";

  const activeSlug = resolveActiveCryptoCategorySlug(
    searchParams.get("category"),
    categories,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/crypto/categories");
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
    if (!isCryptoPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--crypto-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--crypto-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--crypto-tabs-height");
    };
  }, [isCryptoPage, categories.length]);

  if (!isCryptoPage) {
    return null;
  }

  const handleCategoryChange = (slug: string) => {
    if (slug === activeSlug) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("category", slug);

    router.replace(`/crypto?${nextParams.toString()}`, { scroll: false });
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
          aria-label="Crypto 카테고리"
        >
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
              {CRYPTO_SECTION_LABEL}
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
