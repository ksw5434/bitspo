import { NextRequest, NextResponse } from "next/server";
import {
  categoryNameToSlug,
  normalizeBetCategory,
} from "@/lib/bet-categories";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getBetCategoryErrorMessage } from "@/lib/supabase/bet-category-errors";

/** 관리자: Bet 카테고리 수정 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const categoryId = id?.trim();

  if (!categoryId) {
    return NextResponse.json(
      { error: "카테고리 ID가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "카테고리 이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const { data: duplicates } = await auth.supabase
      .from("bet_categories")
      .select("id")
      .ilike("name", name)
      .neq("id", categoryId);

    if (duplicates && duplicates.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리 이름입니다." },
        { status: 409 },
      );
    }

    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? categoryNameToSlug(body.slug)
        : categoryNameToSlug(name);

    let { data: updated, error } = await auth.supabase
      .from("bet_categories")
      .update({ name, slug })
      .eq("id", categoryId)
      .select("id, name, slug, created_at, updated_at")
      .single();

    if (error?.message?.includes("slug")) {
      ({ data: updated, error } = await auth.supabase
        .from("bet_categories")
        .update({ name })
        .eq("id", categoryId)
        .select("id, name, created_at, updated_at")
        .single());
    }

    if (error || !updated) {
      console.error("Bet 카테고리 수정 오류:", error);
      return NextResponse.json(
        { error: getBetCategoryErrorMessage(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: normalizeBetCategory(updated) });
  } catch (error) {
    console.error("Bet 카테고리 수정 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/** 관리자: Bet 카테고리 삭제 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const categoryId = id?.trim();

  if (!categoryId) {
    return NextResponse.json(
      { error: "카테고리 ID가 필요합니다." },
      { status: 400 },
    );
  }

  await auth.supabase
    .from("news_bet_categories")
    .delete()
    .eq("bet_category_id", categoryId);

  const { error } = await auth.supabase
    .from("bet_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Bet 카테고리 삭제 오류:", error);
    return NextResponse.json(
      { error: getBetCategoryErrorMessage(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
