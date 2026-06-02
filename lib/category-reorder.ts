import type { SupabaseClient } from "@supabase/supabase-js";

export type CategoryTableName = "categories" | "sports_categories";

/** 카테고리 ID 배열 순서대로 sort_order 저장 */
export async function reorderCategoryTable(
  supabase: SupabaseClient,
  tableName: CategoryTableName,
  orderedCategoryIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Array.isArray(orderedCategoryIds) || orderedCategoryIds.length === 0) {
    return { ok: false, error: "정렬할 카테고리 목록이 비어 있습니다." };
  }

  const uniqueIds = [...new Set(orderedCategoryIds.map((id) => id.trim()))].filter(
    Boolean,
  );

  if (uniqueIds.length !== orderedCategoryIds.length) {
    return { ok: false, error: "유효하지 않은 카테고리 ID가 포함되어 있습니다." };
  }

  const { data: existingRows, error: selectError } = await supabase
    .from(tableName)
    .select("id")
    .in("id", uniqueIds);

  if (selectError) {
    console.error(`[${tableName}] reorder select 오류:`, selectError);
    return { ok: false, error: "카테고리 목록을 확인하지 못했습니다." };
  }

  if ((existingRows?.length ?? 0) !== uniqueIds.length) {
    return { ok: false, error: "존재하지 않는 카테고리가 포함되어 있습니다." };
  }

  const updateResults = await Promise.all(
    uniqueIds.map((categoryId, sortOrderIndex) =>
      supabase
        .from(tableName)
        .update({ sort_order: sortOrderIndex })
        .eq("id", categoryId),
    ),
  );

  const failedUpdate = updateResults.find((result) => result.error);
  if (failedUpdate?.error) {
    console.error(`[${tableName}] reorder update 오류:`, failedUpdate.error);
    const message = failedUpdate.error.message ?? "";
    if (message.includes("sort_order")) {
      return {
        ok: false,
        error: "sort_order 컬럼이 없습니다. npm run db:push 로 마이그레이션을 적용해 주세요.",
      };
    }
    return { ok: false, error: "순서 저장에 실패했습니다." };
  }

  return { ok: true };
}

/** 새 카테고리 삽입 시 맨 뒤 sort_order */
export async function getNextCategorySortOrder(
  supabase: SupabaseClient,
  tableName: CategoryTableName,
): Promise<number> {
  const { data, error } = await supabase
    .from(tableName)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error?.message?.includes("sort_order")) {
    return 0;
  }

  return typeof data?.sort_order === "number" ? data.sort_order + 1 : 0;
}
