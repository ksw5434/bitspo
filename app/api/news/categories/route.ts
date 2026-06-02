import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeNewsCategory } from "@/lib/news-categories";

/**
 * 뉴스 카테고리 공개 조회 (헤더 서브탭·사이트 네비용)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      // slug / sort_order 컬럼이 없는 경우 name만 조회
      const { data: fallbackData, error: fallbackError } = await supabase
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
  } catch (error) {
    console.error("카테고리 조회 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
