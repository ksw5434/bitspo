"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/_components/ui/button";
import { AdminNewsNav } from "./admin-news-nav";
import { AdminBetNav } from "./admin-bet-nav";
import { AdminCommunityNav } from "./admin-community-nav";
import { AdminCryptoNav } from "./admin-crypto-nav";
import { AdminSportsNav } from "./admin-sports-nav";
import {
  AdminSidebarProvider,
  useAdminSidebar,
} from "./admin-sidebar-context";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useAdminSidebar();

  const adminNavItems: AdminNavItem[] = useMemo(
    () => [
      {
        href: "/admin",
        label: "대시보드",
        icon: <LayoutDashboard className="size-4" aria-hidden />,
      },
      {
        href: "/admin/users",
        label: "회원",
        icon: <Users className="size-4" aria-hidden />,
      },
      {
        href: "/admin/reports",
        label: "신고/제재",
        icon: <Flag className="size-4" aria-hidden />,
      },
      {
        href: "/admin/analytics",
        label: "통계",
        icon: <BarChart3 className="size-4" aria-hidden />,
      },
      {
        href: "/admin/settings",
        label: "설정",
        icon: <Settings className="size-4" aria-hidden />,
      },
    ],
    [],
  );

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:border-r md:border-border md:bg-card/40 transition-[width] duration-200 ease-in-out",
        isCollapsed ? "md:w-[4.25rem]" : "md:w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-4",
          isCollapsed ? "flex-col" : "justify-between",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 min-w-0",
            isCollapsed && "justify-center",
          )}
          title={isCollapsed ? "관리자" : undefined}
        >
          <Shield className="size-5 shrink-0 text-primary" aria-hidden />
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate">관리자</span>
          )}
        </div>

        {!isCollapsed && (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/" aria-label="사이트로 이동">
              사이트
            </Link>
          </Button>
        )}

        {isCollapsed && (
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
          >
            <Link href="/" title="사이트로 이동" aria-label="사이트로 이동">
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2 pb-2"
        aria-label="관리자 메뉴"
      >
        {adminNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isCollapsed ? "justify-center px-2" : "px-3",
                isActive && "bg-accent text-accent-foreground",
              )}
            >
              {item.icon}
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}

        <Suspense fallback={null}>
          <AdminNewsNav />
        </Suspense>
        <Suspense fallback={null}>
          <AdminSportsNav />
        </Suspense>
        <Suspense fallback={null}>
          <AdminCryptoNav />
        </Suspense>
        <Suspense fallback={null}>
          <AdminBetNav />
        </Suspense>
        <Suspense fallback={null}>
          <AdminCommunityNav />
        </Suspense>
      </nav>

      <div className="border-t border-border p-2">
        <Button
          type="button"
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          className={cn("w-full", isCollapsed && "size-9")}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate">메뉴 접기</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">관리자 대시보드</p>
          <h1 className="truncate text-base font-semibold">운영 현황</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: Supabase role 기반 관리자 인증을 붙일 때, 여기에 관리자 정보/로그아웃 UI를 추가 */}
        </div>
      </div>
    </header>
  );
}

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminSidebarProvider>
      <div className="min-h-[calc(100vh-0px)] bg-background">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopbar />
            <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
          </div>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
