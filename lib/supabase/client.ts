import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 사용할 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서 사용
 */
export function createClient() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}
