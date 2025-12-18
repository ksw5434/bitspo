import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth 인증 콜백 처리
 * 소셜 로그인 후 리다이렉트되는 페이지
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    // 인증 코드를 세션으로 교환
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증 완료 후 홈으로 리다이렉트
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

