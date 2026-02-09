"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

/**
 * 전역 에러 페이지 - 루트 레이아웃에서 발생한 에러를 처리
 * 이 페이지는 루트 레이아웃을 포함하지 않으므로 독립적으로 렌더링됨
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션 환경에서는 에러 추적 서비스로 전송)
    console.error("전역 에러 발생:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="bg-muted min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              {/* 에러 아이콘 */}
              <div className="text-6xl mb-4">⚠️</div>
              
              {/* 에러 메시지 */}
              <h1 className="text-3xl font-bold text-primary mb-4">
                심각한 오류가 발생했습니다
              </h1>
              
              <h2 className="text-xl font-semibold mb-4">
                애플리케이션을 불러올 수 없습니다
              </h2>
              
              <p className="text-muted-foreground mb-8">
                시스템에 심각한 오류가 발생했습니다.
                <br />
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
              
              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={reset} size="lg">
                  다시 시도
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  variant="outline"
                  size="lg"
                >
                  홈으로 이동
                </Button>
              </div>
              
              {/* 에러 상세 정보 (개발 환경에서만 표시) */}
              {process.env.NODE_ENV === "development" && error.message && (
                <div className="mt-8 p-4 bg-destructive/10 rounded-lg text-left">
                  <p className="text-sm font-mono text-destructive">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
