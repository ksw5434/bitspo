import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware-helpers";

/**
 * Next.js 미들웨어
 * 인증 상태를 확인하고 세션을 업데이트합니다
 */
export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    // 미들웨어에서 예상치 못한 에러가 발생해도 애플리케이션이 작동하도록 함
    console.error("미들웨어 실행 중 에러 발생:", error);
    // 기본 응답 반환 (요청을 그대로 통과시킴)
    return NextResponse.next();
  }
}

/**
 * 미들웨어가 실행될 경로 설정
 */
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 매칭:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public 폴더의 파일들
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


