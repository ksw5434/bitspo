"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

/**
 * 에러 페이지 - 애플리케이션 에러 발생 시 표시되는 페이지
 * 4XX, 5XX 등 모든 에러를 처리
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션 환경에서는 에러 추적 서비스로 전송)
    console.error("애플리케이션 에러 발생:", error);
  }, [error]);

  return (
    <div className="bg-muted min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          {/* 에러 아이콘 */}
          <div className="text-6xl mb-4">⚠️</div>
          
          {/* 에러 메시지 */}
          <h1 className="text-3xl font-bold text-primary mb-4">
            문제가 발생했습니다
          </h1>
          
          <h2 className="text-xl font-semibold mb-4">
            일시적인 오류가 발생했습니다
          </h2>
          
          <p className="text-muted-foreground mb-8">
            페이지를 불러오는 중 문제가 발생했습니다.
            <br />
            잠시 후 다시 시도해주시거나, 아래 버튼을 통해 다른 페이지로 이동해주세요.
          </p>
          
          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} size="lg">
              다시 시도
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/news">뉴스 보기</Link>
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
  );
}
