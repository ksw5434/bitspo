"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

/**
 * 헤더 메뉴 하단 검색 폼
 */
export function HeaderSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(queryFromUrl);

  // 검색 결과 페이지에서 URL q와 입력값 동기화
  useEffect(() => {
    setSearchInput(queryFromUrl);
  }, [queryFromUrl]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedKeyword = searchInput.trim();
    if (!trimmedKeyword) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmedKeyword)}`);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
      <Input
        type="search"
        name="q"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="검색어를 입력하세요"
        className="h-9 w-full rounded-sm border-primary/40 bg-background pr-10 text-sm shadow-none focus-visible:ring-primary/30"
        aria-label="사이트 검색"
        autoComplete="off"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground hover:text-primary transition-colors cursor-pointer"
        aria-label="검색 실행"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
