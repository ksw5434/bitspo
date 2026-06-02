import type { SupabaseClient } from "@supabase/supabase-js";

/** 뉴스–Crypto 카테고리 연결 동기화 */
export async function syncNewsCryptoCategories(
  supabase: SupabaseClient,
  newsId: string,
  cryptoCategoryIds: string[] | undefined,
): Promise<void> {
  if (cryptoCategoryIds === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("news_crypto_categories")
    .delete()
    .eq("news_id", newsId);

  if (deleteError) {
    if (!deleteError.message.includes("does not exist")) {
      console.error("Crypto 카테고리 관계 삭제 오류:", deleteError);
    }
    return;
  }

  if (!Array.isArray(cryptoCategoryIds) || cryptoCategoryIds.length === 0) {
    return;
  }

  const { data: validCategories, error: selectError } = await supabase
    .from("crypto_categories")
    .select("id")
    .in("id", cryptoCategoryIds);

  if (selectError || !validCategories?.length) {
    return;
  }

  const rows = validCategories.map((category) => ({
    news_id: newsId,
    crypto_category_id: category.id,
  }));

  const { error: insertError } = await supabase
    .from("news_crypto_categories")
    .insert(rows);

  if (insertError) {
    console.error("Crypto 카테고리 연결 오류:", insertError);
  }
}
