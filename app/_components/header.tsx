"use client";

import { Menu, Search, UserIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const menus = [
  { label: "뉴스", path: "/" },
  { label: "커뮤니티", path: "/community" },
  { label: "AI리포트", path: "/ai-report" },
  { label: "멤버십", path: "/membership" },
  { label: "리워드", path: "/reward" },
];

export default function Header() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 네비게이션 높이를 CSS 변수로 설정
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty(
        "--navigation-height",
        `${height}px`
      );
    }
  }, []);

  return (
    <nav
      ref={navRef}
      className="flex  bg-card/50 flex-col backdrop-blur border-b border-border fixed top-0 left-0 right-0 z-50"
    >
      <div className="container w-full">
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
            <DropdownMenu>
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
                    <AvatarImage src="" alt="사용자 프로필" />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
