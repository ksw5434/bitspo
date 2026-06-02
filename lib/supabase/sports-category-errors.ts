/** Supabase 스포츠 카테고리 API 오류 → 사용자 메시지 */
export function getSportsCategoryErrorMessage(error: {
  code?: string;
  message?: string;
} | null): string {
  if (!error) {
    return "카테고리 추가에 실패했습니다.";
  }

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    (message.includes("sports_categories") &&
      message.includes("does not exist"))
  ) {
    return "sports_categories 테이블이 없습니다. 프로젝트 루트에서 npm run db:push 를 실행해 주세요. (SUPABASE_MIGRATIONS.md 참고)";
  }

  if (
    error.code === "42501" ||
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied")
  ) {
    return "권한이 없습니다. 관리자(is_admin) 계정으로 로그인했는지 확인하고, npm run db:push 로 RLS 마이그레이션을 적용해 주세요.";
  }

  if (error.code === "23505" || message.includes("duplicate key")) {
    return "이미 존재하는 카테고리 이름 또는 slug입니다.";
  }

  if (message.includes("slug")) {
    return `카테고리 저장 오류: ${message}`;
  }

  return message || "카테고리 추가에 실패했습니다.";
}
