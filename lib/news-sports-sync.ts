import type { SupabaseClient } from "@supabase/supabase-js";

/** 뉴스–스포츠 카테고리 연결 동기화 */
export async function syncNewsSportsCategories(
  supabase: SupabaseClient,
  newsId: string,
  sportsCategoryIds: string[] | undefined,
): Promise<void> {
  if (sportsCategoryIds === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("news_sports_categories")
    .delete()
    .eq("news_id", newsId);

  if (deleteError) {
    // 테이블 미생성 시 무시
    if (!deleteError.message.includes("does not exist")) {
      console.error("스포츠 카테고리 관계 삭제 오류:", deleteError);
    }
    return;
  }

  if (!Array.isArray(sportsCategoryIds) || sportsCategoryIds.length === 0) {
    return;
  }

  const { data: validCategories, error: selectError } = await supabase
    .from("sports_categories")
    .select("id")
    .in("id", sportsCategoryIds);

  if (selectError || !validCategories?.length) {
    return;
  }

  const rows = validCategories.map((category) => ({
    news_id: newsId,
    sports_category_id: category.id,
  }));

  const { error: insertError } = await supabase
    .from("news_sports_categories")
    .insert(rows);

  if (insertError) {
    console.error("스포츠 카테고리 연결 오류:", insertError);
  }
}
