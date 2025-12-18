import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 사용할 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서 사용
 */
export function createClient() {
  // 클라이언트 컴포넌트에서는 NEXT_PUBLIC_ 접두사가 필요합니다
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
