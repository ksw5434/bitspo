import type { SupabaseClient } from "@supabase/supabase-js";

type DeleteCommunityPostResult =
  | { ok: true; deletedId: string }
  | { ok: false; error: string; status: number };

/**
 * 커뮤니티 게시글 삭제 (관리자 API·대시보드 공통)
 * RLS로 삭제가 막히면 행이 0건이므로 성공으로 오인하지 않도록 검증합니다.
 */
export async function deleteCommunityPostById(
  supabase: SupabaseClient,
  postId: string,
): Promise<DeleteCommunityPostResult> {
  const trimmedPostId = postId?.trim();

  if (!trimmedPostId) {
    return {
      ok: false,
      error: "게시글 ID가 필요합니다.",
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from("communities")
    .delete()
    .eq("id", trimmedPostId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const deletedId = data?.[0]?.id;

  if (!deletedId) {
    return {
      ok: false,
      error:
        "게시글을 삭제하지 못했습니다. 권한이 없거나 이미 삭제된 글일 수 있습니다.",
      status: 404,
    };
  }

  return { ok: true, deletedId };
}

type BulkDeleteCommunityPostsResult =
  | { ok: true; deletedIds: string[] }
  | { ok: false; error: string; status: number };

/** 커뮤니티 게시글 일괄 삭제 (관리자 목록) */
export async function deleteCommunityPostsByIds(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<BulkDeleteCommunityPostsResult> {
  const uniquePostIds = [
    ...new Set(
      postIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id)),
    ),
  ];

  if (uniquePostIds.length === 0) {
    return {
      ok: false,
      error: "삭제할 게시글 ID가 필요합니다.",
      status: 400,
    };
  }

  if (uniquePostIds.length > 100) {
    return {
      ok: false,
      error: "한 번에 최대 100개까지 삭제할 수 있습니다.",
      status: 400,
    };
  }

  const { data, error } = await supabase
    .from("communities")
    .delete()
    .in("id", uniquePostIds)
    .select("id");

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const deletedIds = (data ?? []).map((row) => row.id as string);

  if (deletedIds.length === 0) {
    return {
      ok: false,
      error:
        "선택한 게시글을 삭제하지 못했습니다. 권한이 없거나 이미 삭제된 글일 수 있습니다.",
      status: 404,
    };
  }

  return { ok: true, deletedIds };
}
