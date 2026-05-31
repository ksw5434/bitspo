"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

/** 메인 네비 Crypto 메뉴 라벨 */
const CRYPTO_SECTION_LABEL =
  MAIN_NAV_ITEMS.find((item) => item.path === "/crypto")?.label ?? "Crypto";

/**
 * /crypto 페이지 전용 섹션 바 (헤더 하단, 스크롤 시 상단 고정)
 * Crypto — 하위 메뉴 없음
 */
export function HeaderCryptoTabs() {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isCryptoPage = pathname === "/crypto";

  // sticky 바 높이 — 하위 sticky 요소 offset에 사용
  useEffect(() => {
    const tabsBarElement = tabsBarRef.current;
    if (!isCryptoPage || !tabsBarElement) {
      document.documentElement.style.removeProperty("--crypto-tabs-height");
      return;
    }

    const updateTabsBarHeight = () => {
      document.documentElement.style.setProperty(
        "--crypto-tabs-height",
        `${tabsBarElement.offsetHeight}px`,
      );
    };

    updateTabsBarHeight();

    const resizeObserver = new ResizeObserver(updateTabsBarHeight);
    resizeObserver.observe(tabsBarElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--crypto-tabs-height");
    };
  }, [isCryptoPage]);

  if (!isCryptoPage) {
    return null;
  }

  return (
    <div
      ref={tabsBarRef}
      className="sticky top-0 z-50 w-full border-y border-border bg-card/95 backdrop-blur-sm"
    >
      <div className="container w-full px-2 py-1.5">
        <div
          className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-base"
          aria-label="Crypto 섹션"
        >
          <span className="font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
            {CRYPTO_SECTION_LABEL}
          </span>
        </div>
      </div>
    </div>
  );
}
