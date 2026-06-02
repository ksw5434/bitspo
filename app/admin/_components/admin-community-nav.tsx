"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUNITY_SECTION_LABELS } from "@/lib/community-sections";
import { useAdminSidebar } from "./admin-sidebar-context";

const SECTION_LINKS = [
  { section: "forum" as const, href: "/admin/community/forum" },
  { section: "discussion" as const, href: "/admin/community/discussion" },
  { section: "guestbook" as const, href: "/admin/community/guestbook" },
];

/** Community Forum / Discussion / Guestbook 관리 */
export function AdminCommunityNav() {
  const pathname = usePathname();
  const { isCollapsed } = useAdminSidebar();
  const [expanded, setExpanded] = useState(false);

  const isCommunitySection = pathname?.startsWith("/admin/community") ?? false;

  if (isCollapsed) {
    return (
      <Link
        href="/admin/community/forum"
        title="Community"
        aria-label="Community"
        className={cn(
          "flex items-center justify-center rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isCommunitySection && "bg-accent text-accent-foreground",
        )}
      >
        <MessagesSquare className="size-4 shrink-0" aria-hidden />
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
          isCommunitySection && "bg-accent text-accent-foreground",
        )}
        aria-expanded={expanded}
      >
        <MessagesSquare className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Community</span>
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
          {SECTION_LINKS.map(({ section, href }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={section}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground truncate",
                  isActive && "bg-accent/80 text-accent-foreground font-medium",
                )}
              >
                {COMMUNITY_SECTION_LABELS[section]}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
