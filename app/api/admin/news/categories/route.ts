import { NextRequest, NextResponse } from "next/server";
import {
  categoryNameToSlug,
  normalizeNewsCategory,
} from "@/lib/news-categories";
import { getNextCategorySortOrder } from "@/lib/category-reorder";
import { requireAdminApi } from "@/lib/admin/require-admin";

/** 관리자: 카테고리 목록·추가 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("categories")
    .select("id, name, slug, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await auth.supabase
      .from("categories")
      .select("id, name, created_at, updated_at")
      .order("name", { ascending: true });

    if (fallbackError) {
      console.error("카테고리 조회 오류:", fallbackError);
      return NextResponse.json(
        { error: "카테고리를 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: (fallbackData ?? []).map((row) => normalizeNewsCategory(row)),
    });
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => normalizeNewsCategory(row)),
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

    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? categoryNameToSlug(body.slug)
        : categoryNameToSlug(name);

    // 중복 이름 확인
    const { data: existing } = await auth.supabase
      .from("categories")
      .select("id, name")
      .ilike("name", name);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리입니다." },
        { status: 409 },
      );
    }

    const sortOrder = await getNextCategorySortOrder(auth.supabase, "categories");
    const insertPayload: Record<string, string | number> = {
      name,
      slug,
      sort_order: sortOrder,
    };

    let { data: created, error } = await auth.supabase
      .from("categories")
      .insert(insertPayload)
      .select("id, name, slug, created_at, updated_at")
      .single();

    // slug / sort_order 컬럼 미존재 시 단계적 재시도
    if (error?.message?.includes("slug")) {
      ({ data: created, error } = await auth.supabase
        .from("categories")
        .insert({ name, sort_order: sortOrder })
        .select("id, name, created_at, updated_at")
        .single());
    }

    if (error?.message?.includes("sort_order")) {
      ({ data: created, error } = await auth.supabase
        .from("categories")
        .insert({ name, slug })
        .select("id, name, slug, created_at, updated_at")
        .single());
    }

    if (error || !created) {
      console.error("카테고리 추가 오류:", error);
      return NextResponse.json(
        { error: "카테고리 추가에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { data: normalizeNewsCategory(created) },
      { status: 201 },
    );
  } catch (error) {
    console.error("카테고리 추가 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
