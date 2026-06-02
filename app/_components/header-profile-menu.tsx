"use client";

import {
  Menu,
  UserIcon,
  LogOut,
  LayoutDashboard,
  Newspaper,
  Shield,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "@supabase/supabase-js";

interface HeaderProfileMenuProps {
  mounted: boolean;
  user: User | null;
  userProfile: { name?: string; avatar_url?: string } | null;
  /** profiles.is_admin === true 일 때만 관리자 메뉴 표시 */
  isAdmin: boolean;
  isLoading: boolean;
  isDropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
  getUserInitials: () => string;
}

/**
 * 헤더 우측 프로필·햄버거 드롭다운
 */
export function HeaderProfileMenu({
  mounted,
  user,
  userProfile,
  isAdmin,
  isLoading,
  isDropdownOpen,
  onDropdownOpenChange,
  onLogout,
  getUserInitials,
}: HeaderProfileMenuProps) {
  const profileButtonClassName =
    "flex items-center gap-2 px-2 py-1 border border-border rounded-lg hover:bg-muted transition-colors relative shrink-0 cursor-pointer";

  if (!mounted) {
    return (
      <button
        type="button"
        className={profileButtonClassName}
        aria-label="메뉴 및 프로필"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
        <Avatar className="w-6 h-6">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            <UserIcon className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  return (
    <DropdownMenu
      open={isDropdownOpen}
      onOpenChange={onDropdownOpenChange}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={profileButtonClassName}
          aria-label="메뉴 및 프로필"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={userProfile?.avatar_url ?? ""}
              alt={userProfile?.name ?? "사용자 프로필"}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {user ? (
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
          <DropdownMenuItem disabled>로딩 중...</DropdownMenuItem>
        ) : user ? (
          <>
            {userProfile?.name && (
              <div className="px-2 py-1.5 text-sm font-medium text-foreground border-b border-border">
                {userProfile.name}
              </div>
            )}
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  관리자 대시보드
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                프로필
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/news" className="flex items-center gap-2 cursor-pointer">
                <Newspaper className="w-4 h-4" />
                뉴스
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/community" className="flex items-center gap-2 cursor-pointer">
                <Newspaper className="w-4 h-4" />
                커뮤니티
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/auth/login" className="block w-full cursor-pointer">
                로그인
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth/signup" className="block w-full cursor-pointer">
                회원가입
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
