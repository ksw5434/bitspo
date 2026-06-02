"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { NewsCategoryRecord } from "@/lib/news-categories";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

const NEWS_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/news")?.label ?? "News";

type NewsSubNavProps = {
  /** 사이드바용 컴팩트 스타일 */
  variant?: "bar" | "inline";
};

/**
 * News 글쓰기 영역 서브 네비 (첨부 이미지 스타일)
 * News | 카테고리1 | 카테고리2 ...
 */
export function NewsSubNav({ variant = "bar" }: NewsSubNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get("category");
  const [categories, setCategories] = useState<NewsCategoryRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isNewsAdminRoute = pathname?.startsWith("/admin/news");

  useEffect(() => {
    if (!isNewsAdminRoute) return;

    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/news/categories");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "카테고리 로드 실패");
        }
        if (!cancelled) {
          setCategories(json.data ?? []);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "카테고리 로드 실패",
          );
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [isNewsAdminRoute, pathname]);

  if (!isNewsAdminRoute) {
    return null;
  }

  const isCategoriesPage = pathname === "/admin/news/categories";
  const isAllActive = !activeCategorySlug && !isCategoriesPage && pathname === "/admin/news";

  const linkClass = (isActive: boolean) =>
    cn(
      "whitespace-nowrap transition-colors",
      variant === "bar" && "text-base",
      variant === "inline" && "text-sm rounded-md px-2 py-1",
      isActive
        ? "font-semibold text-foreground"
        : "font-medium text-muted-foreground hover:text-foreground",
    );

  const newsLabelClass = cn(
    "font-semibold whitespace-nowrap",
    variant === "bar"
      ? "text-red-500 dark:text-red-400"
      : "text-primary",
  );

  const separator = (
    <span
      className="text-muted-foreground/40 select-none"
      aria-hidden
    >
      |
    </span>
  );

  return (
    <nav
      className={cn(
        variant === "bar" &&
          "mb-6 border-y border-border bg-card/50 px-1 py-2 -mx-1",
        variant === "inline" && "space-y-1",
      )}
      aria-label="뉴스 카테고리"
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1",
          variant === "inline" && "flex-col items-stretch gap-1",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Link href="/admin/news" className={newsLabelClass}>
            {NEWS_SECTION_LABEL}
          </Link>
          {variant === "bar" && separator}
        </span>

        <Link
          href="/admin/news"
          className={linkClass(isAllActive)}
        >
          전체
        </Link>

        {categories.map((category) => {
          const isActive = activeCategorySlug === category.slug;
          return (
            <span
              key={category.id}
              className="inline-flex items-center gap-2"
            >
              {variant === "bar" && separator}
              <Link
                href={`/admin/news?category=${encodeURIComponent(category.slug)}`}
                className={linkClass(isActive)}
              >
                {category.name}
              </Link>
            </span>
          );
        })}

        {variant === "bar" && separator}

        <Link
          href="/admin/news/categories"
          className={linkClass(isCategoriesPage)}
        >
          카테고리 관리
        </Link>
      </div>

      {loadError && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {loadError}
        </p>
      )}
    </nav>
  );
}
