import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버에서 사용할 Supabase 클라이언트 생성
 * 서버 컴포넌트나 API 라우트에서 사용
 */
export async function createClient() {
  const cookieStore = await cookies();

  // 서버에서는 일반 환경 변수 또는 NEXT_PUBLIC_ 접두사 변수 사용 가능
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });
}
