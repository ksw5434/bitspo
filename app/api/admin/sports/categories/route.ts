import { NextRequest, NextResponse } from "next/server";
import {
  categoryNameToSlug,
  normalizeSportsCategory,
} from "@/lib/sports-categories";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getNextCategorySortOrder } from "@/lib/category-reorder";
import { getSportsCategoryErrorMessage } from "@/lib/supabase/sports-category-errors";

/** 관리자: 스포츠 카테고리 목록·추가 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("sports_categories")
    .select("id, name, slug, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await auth.supabase
      .from("sports_categories")
      .select("id, name, created_at, updated_at")
      .order("name", { ascending: true });

    if (fallbackError) {
      console.error("스포츠 카테고리 조회 오류:", fallbackError);
      return NextResponse.json(
        { error: getSportsCategoryErrorMessage(fallbackError), data: [] },
        { status: fallbackError.code === "42P01" ? 503 : 500 },
      );
    }

    return NextResponse.json({
      data: (fallbackData ?? []).map((row) => normalizeSportsCategory(row)),
    });
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => normalizeSportsCategory(row)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "카테고리 이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const slug = categoryNameToSlug(name);

    const { data: existing, error: existingError } = await auth.supabase
      .from("sports_categories")
      .select("id")
      .ilike("name", name);

    if (existingError) {
      console.error("스포츠 카테고리 중복 확인 오류:", existingError);
      return NextResponse.json(
        { error: getSportsCategoryErrorMessage(existingError) },
        { status: 500 },
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리입니다." },
        { status: 409 },
      );
    }

    const sortOrder = await getNextCategorySortOrder(
      auth.supabase,
      "sports_categories",
    );

    // slug 포함 삽입 시도 → 실패 시 name만 삽입
    let { data: created, error: insertError } = await auth.supabase
      .from("sports_categories")
      .insert({ name, slug, sort_order: sortOrder })
      .select("id, name, slug, created_at, updated_at")
      .single();

    const shouldRetryWithoutSlug =
      insertError &&
      (insertError.message?.includes("slug") ||
        insertError.code === "42703" ||
        insertError.code === "PGRST204");

    if (shouldRetryWithoutSlug) {
      ({ data: created, error: insertError } = await auth.supabase
        .from("sports_categories")
        .insert({ name, sort_order: sortOrder })
        .select("id, name, created_at, updated_at")
        .single());
    }

    if (insertError?.message?.includes("sort_order")) {
      ({ data: created, error: insertError } = await auth.supabase
        .from("sports_categories")
        .insert({ name, slug })
        .select("id, name, slug, created_at, updated_at")
        .single());
    }

    if (insertError || !created) {
      console.error("스포츠 카테고리 추가 오류:", insertError);
      return NextResponse.json(
        { error: getSportsCategoryErrorMessage(insertError) },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { data: normalizeSportsCategory(created) },
      { status: 201 },
    );
  } catch (error) {
    console.error("스포츠 카테고리 추가 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
