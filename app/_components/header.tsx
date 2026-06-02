"use client";

import { Fragment, Suspense, useEffect, useRef, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { HeaderSearchForm } from "./header-search-form";
import { HeaderProfileMenu } from "./header-profile-menu";
import { MarketTickerBar } from "./market-ticker-bar";
import { HeaderNewsTabs } from "./header-news-tabs";
import { HeaderSportsTabs } from "./header-sports-tabs";
import { HeaderBetTabs } from "./header-bet-tabs";
import { HeaderCommunityTabs } from "./header-community-tabs";
import { HeaderCryptoTabs } from "./header-crypto-tabs";

export default function Header() {
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAdminRoute) return;

    setMounted(true);

    const navElement = navRef.current;
    if (!navElement) return;

    const updateNavigationHeight = () => {
      document.documentElement.style.setProperty(
        "--navigation-height",
        `${navElement.offsetHeight}px`,
      );
    };

    updateNavigationHeight();

    const resizeObserver = new ResizeObserver(updateNavigationHeight);
    resizeObserver.observe(navElement);

    return () => resizeObserver.disconnect();
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) {
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let hasInitialized = false;

    const fetchUserProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url, is_admin")
          .eq("id", userId)
          .single();

        setUserProfile(
          profile
            ? { name: profile.name, avatar_url: profile.avatar_url }
            : null,
        );
        setIsAdmin(profile?.is_admin === true);
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        setUserProfile(null);
        setIsAdmin(false);
      }
    };

    const checkUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          await fetchUserProfile(currentUser.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("사용자 확인 오류:", error);
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      } finally {
        hasInitialized = true;
        setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!hasInitialized) return;

      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
    });

    checkUser();

    return () => subscription.unsubscribe();
  }, [supabase, isAdminRoute]);

  const handleLogout = async () => {
    if (!supabase) return;

    try {
      setIsDropdownOpen(false);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
        return;
      }

      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const getUserInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "";
  };

  // 관리자 페이지는 AdminShell 사용 — hooks는 항상 동일하게 호출한 뒤 렌더만 생략
  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <nav
        ref={navRef}
        className="relative z-50 flex flex-col border-b border-border bg-card/50 backdrop-blur"
      >
        <div className="container w-full px-2 py-2">
          <div className="flex items-stretch gap-3 sm:gap-4">
            {/* 기존 로고 이미지 유지 */}
            <Link
              href="/"
              className="flex shrink-0 items-center self-center py-1 cursor-pointer"
              aria-label="비트스포 홈"
            >
              <img
                src="/logo_w.png"
                alt="비트스포 로고"
                className="h-12 w-auto"
                onError={(event) => {
                  const imageElement = event.currentTarget;
                  if (imageElement.src.includes("simbol.png")) return;
                  imageElement.src = "/simbol.png";
                }}
              />
            </Link>

            {/* 메뉴 + 검색 + 프로필 */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
              <div className="flex items-center justify-between gap-3">
                <nav
                  className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
                  aria-label="메인 메뉴"
                >
                  {MAIN_NAV_ITEMS.map((menu, menuIndex) => (
                    <Fragment key={menu.path}>
                      {menuIndex > 0 && (
                        <span
                          className="text-muted-foreground/40 select-none"
                          aria-hidden
                        >
                          |
                        </span>
                      )}
                      <Link
                        href={menu.path}
                        className="font-medium whitespace-nowrap hover:text-foreground transition-colors cursor-pointer"
                      >
                        {menu.label}
                      </Link>
                    </Fragment>
                  ))}
                </nav>

                <HeaderProfileMenu
                  mounted={mounted}
                  user={user}
                  userProfile={userProfile}
                  isAdmin={isAdmin}
                  isLoading={isLoading}
                  isDropdownOpen={isDropdownOpen}
                  onDropdownOpenChange={setIsDropdownOpen}
                  onLogout={handleLogout}
                  getUserInitials={getUserInitials}
                />
              </div>

              {/* 메뉴 바로 아래 검색창 */}
              <Suspense
                fallback={
                  <div
                    className="h-9 w-full rounded-sm border border-primary/40 bg-muted/30 animate-pulse"
                    aria-hidden
                  />
                }
              >
                <HeaderSearchForm />
              </Suspense>
            </div>
          </div>
        </div>

        {/* 메뉴·검색 아래 실시간 시세 바 (모든 페이지 공통) */}
        <MarketTickerBar />
      </nav>

      {/* /news, /sports, /crypto, /bet, /community 전용 서브 탭 */}
      <Suspense fallback={null}>
        <HeaderNewsTabs />
        <HeaderSportsTabs />
        <HeaderCryptoTabs />
        <HeaderBetTabs />
        <HeaderCommunityTabs />
      </Suspense>
    </>
  );
}
