import { Suspense } from "react";
import { SportsPageContent } from "./sports-page-content";

/**
 * Sports 페이지 — 상단 7:3 뉴스 레이아웃 + 하단 Scores
 */
export default function SportsPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto w-full max-w-7xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
      }
    >
      <SportsPageContent />
    </Suspense>
  );
}
