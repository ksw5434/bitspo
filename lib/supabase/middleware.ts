import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 미들웨어에서 사용할 Supabase 클라이언트 생성
 * 인증 상태 확인 및 리다이렉트 처리에 사용
 */
export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    // 미들웨어에서는 일반 환경 변수 또는 NEXT_PUBLIC_ 접두사 변수 사용 가능
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 환경 변수가 없으면 에러를 던지지 않고 그냥 다음으로 넘어감
    // 미들웨어는 모든 요청에 대해 실행되므로 실패해도 애플리케이션이 작동해야 함
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        "Supabase 환경 변수가 설정되지 않았습니다. 미들웨어에서 인증 처리를 건너뜁니다."
      );
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // 세션 새로고침 (에러가 발생해도 미들웨어는 계속 진행)
    try {
      await supabase.auth.getUser();
    } catch (authError) {
      // 인증 에러는 무시하고 계속 진행 (로그인하지 않은 사용자도 접근 가능)
      console.debug("미들웨어 인증 확인 중 에러 발생 (무시됨):", authError);
    }

    return supabaseResponse;
  } catch (error) {
    // 미들웨어에서 예상치 못한 에러가 발생해도 애플리케이션이 작동하도록 함
    console.error("미들웨어 실행 중 에러 발생:", error);
    return NextResponse.next({
      request,
    });
  }
}
