"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, FileText, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsCategoryRecord } from "@/lib/news-categories";
import { useAdminSidebar } from "./admin-sidebar-context";

/** 사이드바 News 메뉴 + 동적 카테고리 하위 링크 */
export function AdminNewsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get("category");
  const { isCollapsed } = useAdminSidebar();

  const [categories, setCategories] = useState<NewsCategoryRecord[]>([]);
  const [expanded, setExpanded] = useState(false);

  const isNewsSection = pathname?.startsWith("/admin/news") ?? false;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/news/categories");
        const json = await res.json();
        if (!cancelled && res.ok) {
          setCategories(json.data ?? []);
        }
      } catch {
        // 사이드바는 조용히 실패 처리
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isParentActive = isNewsSection;
  const isAllActive =
    pathname === "/admin/news" && !activeCategorySlug;
  const isCategoriesPage = pathname === "/admin/news/categories";

  if (isCollapsed) {
    return (
      <Link
        href="/admin/news"
        title="News 글쓰기"
        aria-label="News 글쓰기"
        className={cn(
          "flex items-center justify-center rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isParentActive && "bg-accent text-accent-foreground",
        )}
      >
        <FileText className="size-4 shrink-0" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isParentActive && "bg-accent text-accent-foreground",
        )}
        aria-expanded={expanded}
      >
        <FileText className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">News 글쓰기</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
          <Link
            href="/admin/news"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isAllActive && "bg-accent/80 text-accent-foreground font-medium",
            )}
          >
            전체 글
          </Link>

          {categories.map((category) => {
            const isActive =
              pathname === "/admin/news" &&
              activeCategorySlug === category.slug;

            return (
              <Link
                key={category.id}
                href={`/admin/news?category=${encodeURIComponent(category.slug)}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground truncate",
                  isActive && "bg-accent/80 text-accent-foreground font-medium",
                )}
              >
                {category.name}
              </Link>
            );
          })}

          <Link
            href="/admin/news/new"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              pathname === "/admin/news/new" &&
                "bg-accent/80 text-accent-foreground font-medium",
            )}
          >
            새 글 작성
          </Link>

          <Link
            href="/admin/news/categories"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isCategoriesPage &&
                "bg-accent/80 text-accent-foreground font-medium",
            )}
          >
            <Tag className="size-3.5 shrink-0" aria-hidden />
            카테고리 관리
          </Link>
        </div>
      )}
    </div>
  );
}
