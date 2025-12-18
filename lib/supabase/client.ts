import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 사용할 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서 사용
 */
export function createClient() {
  // 클라이언트 컴포넌트에서는 NEXT_PUBLIC_ 접두사가 필요합니다
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // prerendering 시 환경 변수가 없을 수 있으므로, 빈 문자열로 전달하여 에러 방지
  // 실제 브라우저에서 실행될 때는 환경 변수가 있어야 하며,
  // createBrowserClient가 자체적으로 검증합니다
  return createBrowserClient(
    supabaseUrl || "",
    supabaseAnonKey || ""
  );
}
