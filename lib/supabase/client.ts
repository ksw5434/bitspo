import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 사용할 Supabase 클라이언트 생성
 * 클라이언트 컴포넌트에서 사용
 *
 * 주의: 빌드 타임에는 환경 변수가 없을 수 있으므로,
 * 클라이언트 컴포넌트에서는 useEffect나 useMemo 내에서 호출하는 것을 권장합니다.
 */
export function createClient() {
  // 클라이언트 컴포넌트에서는 NEXT_PUBLIC_ 접두사가 필요합니다
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드 타임(prerendering)에는 환경 변수가 없을 수 있으므로 체크
  // 브라우저에서 실행될 때만 환경 변수가 필요합니다
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 타임에는 환경 변수가 없을 수 있으므로,
    // 더미 값을 전달하여 에러를 방지합니다.
    // 실제 브라우저에서 실행될 때는 환경 변수가 있어야 합니다.
    // createBrowserClient는 빈 문자열을 받으면 에러를 던지므로,
    // 빌드 타임에는 더미 값을 전달하고, 런타임에는 환경 변수를 사용합니다.
    if (typeof window === "undefined") {
      // 서버 사이드(빌드 타임)에서는 더미 클라이언트 반환
      // 실제로는 클라이언트 컴포넌트이므로 브라우저에서만 실행됨
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }

    // 브라우저에서 실행 중인데 환경 변수가 없으면 에러
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요."
    );
  }

  // 환경 변수가 있으면 정상적으로 클라이언트 생성
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
