"use client";

import { useEffect, useState } from "react";

/**
 * 브라우저 로컬 타임존 기준 "오늘" 날짜 라벨
 * SSR 시점과 클라이언트의 시간대가 다르면 hydration 불일치가 나므로 마운트 후에만 표시
 */
function formatTodayLabel(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const weekdays = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  const weekday = weekdays[today.getDay()];
  return `오늘, ${year}. ${month}. ${day}. ${weekday}`;
}

interface ClientOnlyDateProps {
  className?: string;
  /** 마운트 전 표시할 플레이스홀더 (레이아웃 시프트 방지) */
  placeholder?: string;
}

export function ClientOnlyDate({
  className,
  placeholder = "오늘",
}: ClientOnlyDateProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={className} suppressHydrationWarning>
      {isMounted ? formatTodayLabel() : placeholder}
    </div>
  );
}
