"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Dice5, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BetCategoryRecord } from "@/lib/bet-categories";
import { useAdminSidebar } from "./admin-sidebar-context";

/** 사이드바 Bet 글쓰기 + 동적 카테고리 하위 링크 */
export function AdminBetNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get("category");
  const { isCollapsed } = useAdminSidebar();

  const [categories, setCategories] = useState<BetCategoryRecord[]>([]);
  const [expanded, setExpanded] = useState(false);

  const isBetSection = pathname?.startsWith("/admin/bet") ?? false;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/bet/categories");
        const json = await res.json();
        if (!cancelled && res.ok) {
          setCategories(json.data ?? []);
        }
      } catch {
        // 사이드바는 조용히 실패
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isParentActive = isBetSection;
  const isAllActive = pathname === "/admin/bet" && !activeCategorySlug;
  const isCategoriesPage = pathname === "/admin/bet/categories";

  if (isCollapsed) {
    return (
      <Link
        href="/admin/bet"
        title="Bet 글쓰기"
        aria-label="Bet 글쓰기"
        className={cn(
          "flex items-center justify-center rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isParentActive && "bg-accent text-accent-foreground",
        )}
      >
        <Dice5 className="size-4 shrink-0" aria-hidden />
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
        <Dice5 className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Bet 글쓰기</span>
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
            href="/admin/bet"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isAllActive && "bg-accent/80 text-accent-foreground font-medium",
            )}
          >
            전체 글
          </Link>

          {categories.map((category) => {
            const isActive =
              pathname === "/admin/bet" &&
              activeCategorySlug === category.slug;

            return (
              <Link
                key={category.id}
                href={`/admin/bet?category=${encodeURIComponent(category.slug)}`}
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
            href="/admin/bet/new"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              pathname === "/admin/bet/new" &&
                "bg-accent/80 text-accent-foreground font-medium",
            )}
          >
            새 글 작성
          </Link>

          <Link
            href="/admin/bet/categories"
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
