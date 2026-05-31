"use client";

import { Fragment, Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { HeaderSearchForm } from "./header-search-form";
import { HeaderProfileMenu } from "./header-profile-menu";

export default function Header() {
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

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
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let hasInitialized = false;

    const fetchUserProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", userId)
          .single();

        setUserProfile(profile ?? null);
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        setUserProfile(null);
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
        }
      } catch (error) {
        console.error("사용자 확인 오류:", error);
        setUser(null);
        setUserProfile(null);
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
      }
    });

    checkUser();

    return () => subscription.unsubscribe();
  }, [supabase]);

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

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-border bg-card/50 backdrop-blur"
    >
      <div className="container w-full px-2 py-2">
        <div className="flex items-stretch gap-3 sm:gap-4">
          {/* 기존 로고 이미지 유지 */}
          <Link
            href="/"
            className="flex shrink-0 items-center self-center py-1"
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
                      className="font-medium whitespace-nowrap hover:text-foreground transition-colors"
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
    </nav>
  );
}
