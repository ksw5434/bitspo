"use client";

import {
  Menu,
  Search,
  UserIcon,
  LogOut,
  LayoutDashboard,
  Newspaper,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const menus = [
  { label: "뉴스", path: "/" },
  { label: "커뮤니티", path: "/community" },
  { label: "AI리포트", path: "/ai-report" },
  { label: "멤버십", path: "/membership" },
  { label: "리워드", path: "/reward" },
];

export default function Header() {
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // 브라우저에서만 Supabase 클라이언트 생성 (빌드 타임 에러 방지)
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createClient();
  }, []);

  // 클라이언트 마운트 상태 (hydration 에러 방지)
  const [mounted, setMounted] = useState(false);

  // 사용자 상태 관리
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 드롭다운 메뉴 열림 상태 관리
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // 클라이언트 마운트 완료 표시 (hydration 에러 방지)
    setMounted(true);

    // 네비게이션 높이를 CSS 변수로 설정
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty(
        "--navigation-height",
        `${height}px`
      );
    }
  }, []);

  // 사용자 인증 상태 확인 및 리스너 설정
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 초기 로딩 완료 여부 추적 (중복 호출 방지)
    let hasInitialized = false;

    // 프로필 정보 가져오기 함수 (재사용)
    const fetchUserProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", userId)
          .single();

        if (profile) {
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        setUserProfile(null);
      }
    };

    // 초기 사용자 상태 확인 (먼저 실행하여 빠른 로딩)
    const checkUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          // 프로필 정보 가져오기
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
        // 초기 확인 완료 후 로딩 상태 해제
        hasInitialized = true;
        setIsLoading(false);
      }
    };

    // 인증 상태 변경 리스너 설정 (이후 상태 변경만 처리)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 초기 로딩이 완료된 후에만 상태 변경 처리
      if (!hasInitialized) {
        return;
      }

      // 인증 상태가 변경된 경우
      if (session?.user) {
        setUser(session.user);
        // 프로필 정보 가져오기
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    // 초기 사용자 확인 실행
    checkUser();

    // 클린업 함수
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    if (!supabase) return;

    try {
      // 드롭다운 메뉴 닫기
      setIsDropdownOpen(false);

      // 로그아웃 실행
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
        return;
      }

      // 상태 초기화 (인증 리스너가 자동으로 처리하지만 명시적으로 초기화)
      setUser(null);
      setUserProfile(null);

      // 로그아웃 성공 시 홈으로 이동
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // 사용자 이름 또는 이메일에서 이니셜 추출
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
      className="flex bg-card/50 flex-col backdrop-blur border-b border-border fixed top-0 left-0 right-0 z-50"
    >
      <div className="container w-full px-2">
        {/* 상단 헤더: 검색과 햄버거/프로필 버튼 */}
        <Link href="/" className="flex items-center py-2">
          <img src="/logo_w.png" alt="로고" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center justify-between h-12">
          {/* 메뉴 링크들 */}
          <div className="flex gap-6 h-16 items-center">
            {menus.map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                className="text-md font-medium hover:text-muted-foreground transition-colors"
              >
                {menu.label}
              </Link>
            ))}
          </div>
          {/* 오른쪽 메뉴 */}
          <div className="flex items-center gap-4">
            {/* 검색 아이콘 버튼 */}
            <button
              type="button"
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="검색"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            {/* 햄버거 메뉴와 프로필이 결합된 버튼 */}
            {mounted ? (
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-2 py-1 border border-border rounded-lg hover:bg-muted transition-colors relative"
                    aria-label="메뉴 및 프로필"
                  >
                    {/* 햄버거 메뉴 아이콘 */}
                    <Menu className="w-5 h-5 text-muted-foreground" />

                    {/* 사용자 프로필 Avatar */}
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={
                          mounted && userProfile?.avatar_url
                            ? userProfile.avatar_url
                            : ""
                        }
                        alt={
                          mounted && userProfile?.name
                            ? userProfile.name
                            : "사용자 프로필"
                        }
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {mounted && user ? (
                          getUserInitials() || <UserIcon className="w-4 h-4" />
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isLoading ? (
                    // 로딩 중일 때
                    <DropdownMenuItem disabled>로딩 중...</DropdownMenuItem>
                  ) : user ? (
                    // 로그인 상태일 때
                    <>
                      {userProfile?.name && (
                        <div className="px-2 py-1.5 text-sm font-medium text-foreground border-b border-border">
                          {userProfile.name}
                        </div>
                      )}
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          대시보드
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/profile"
                          className="flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4" />
                          프로필
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/news"
                          className="flex items-center gap-2"
                        >
                          <Newspaper className="w-4 h-4" />
                          뉴스
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </DropdownMenuItem>
                    </>
                  ) : (
                    // 비로그인 상태일 때
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/login" className="block w-full">
                          로그인
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/signup" className="block w-full">
                          회원가입
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // 마운트 전에는 간단한 버튼만 표시 (hydration 에러 방지)
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-1 border border-border rounded-lg hover:bg-muted transition-colors relative"
                aria-label="메뉴 및 프로필"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
