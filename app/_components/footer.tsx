"use client";

import Link from "next/link";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-2 py-8">
        {/* 상단: 로고 및 주요 링크 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* 로고 */}
          <Link href="/" className="flex items-center cursor-pointer">
            <img
              src="/logo_w.png"
              alt="비트스포 로고"
              className="h-10 w-auto"
              onError={(e) => {
                // 로고 이미지 로드 실패 시 대체 이미지 사용
                const target = e.target as HTMLImageElement;
                target.src = "/simbol.png";
              }}
            />
          </Link>

          {/* 주요 메뉴 링크 */}
          <nav
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            aria-label="푸터 메뉴"
          >
            {MAIN_NAV_ITEMS.map((menu, menuIndex) => (
              <span key={menu.path} className="inline-flex items-center gap-2">
                {menuIndex > 0 && (
                  <span className="text-muted-foreground/40" aria-hidden>
                    |
                  </span>
                )}
                <Link
                  href={menu.path}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  {menu.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        {/* 중간: 회사 정보 및 정책 링크 */}
        <div className="border-t border-border pt-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* 왼쪽: 회사 정보 */}
            <div className="flex-1">
              <h3 className="sr-only">비트스포</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {/* 첫 번째 줄: 공지사항, 기자소개, 인재채용, 커뮤니티 운영정책 */}
                {/* TODO: 페이지 생성 후 주석 해제
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/notice"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    공지사항
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/reporters"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    기자소개
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/careers"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    인재채용
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/community-policy"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    커뮤니티 운영정책
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    이용약관
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    개인정보처리방침
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/ethics"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    윤리강령
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <Link
                    href="/youth-protection"
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    청소년보호정책
                  </Link>
                </div>
                */}

                {/* 문의사항 이메일 */}
                <div className="pt-2">
                  <p className="text-muted-foreground">
                    문의사항{" "}
                    <a
                      href="mailto:help@bitspo.io"
                      className="text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      help@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* 오른쪽: 소셜 미디어 및 추가 정보 */}
            <div className="flex flex-col items-start md:items-end gap-4">
              {/* 소셜 미디어 버튼들 */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-muted-foreground transition-colors text-xl cursor-pointer"
                  aria-label="공유하기"
                  title="공유하기"
                >
                  📤
                </button>
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-muted-foreground transition-colors text-xl cursor-pointer"
                  aria-label="닫기"
                  title="닫기"
                >
                  ✕
                </button>
              </div>

              {/* 회사명 및 연도 */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>비트스포</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 저작권 정보 */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {currentYear} 비트스포. All rights reserved.</p>
            <p className="text-muted-foreground/70">
              본 사이트의 모든 콘텐츠는 저작권법의 보호를 받습니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
