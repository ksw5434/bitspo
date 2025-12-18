import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버에서 사용할 Supabase 클라이언트 생성
 * 서버 컴포넌트나 API 라우트에서 사용
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 쿠키 설정 실패 시 무시 (서버 컴포넌트에서 발생할 수 있음)
          }
        },
      },
    }
  );
}
