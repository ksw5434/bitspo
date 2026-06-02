import type { SupabaseClient } from "@supabase/supabase-js";

/** 뉴스–Bet 카테고리 연결 동기화 */
export async function syncNewsBetCategories(
  supabase: SupabaseClient,
  newsId: string,
  betCategoryIds: string[] | undefined,
): Promise<void> {
  if (betCategoryIds === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("news_bet_categories")
    .delete()
    .eq("news_id", newsId);

  if (deleteError) {
    if (!deleteError.message.includes("does not exist")) {
      console.error("Bet 카테고리 관계 삭제 오류:", deleteError);
    }
    return;
  }

  if (!Array.isArray(betCategoryIds) || betCategoryIds.length === 0) {
    return;
  }

  const { data: validCategories, error: selectError } = await supabase
    .from("bet_categories")
    .select("id")
    .in("id", betCategoryIds);

  if (selectError || !validCategories?.length) {
    return;
  }

  const rows = validCategories.map((category) => ({
    news_id: newsId,
    bet_category_id: category.id,
  }));

  const { error: insertError } = await supabase
    .from("news_bet_categories")
    .insert(rows);

  if (insertError) {
    console.error("Bet 카테고리 연결 오류:", insertError);
  }
}
