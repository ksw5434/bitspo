import { NextRequest, NextResponse } from "next/server";
import { reorderCategoryTable } from "@/lib/category-reorder";
import { requireAdminApi } from "@/lib/admin/require-admin";

/** 관리자: Crypto 카테고리 순서 저장 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const orderedIds = body.ordered_ids ?? body.orderedIds;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "ordered_ids 배열이 필요합니다." },
        { status: 400 },
      );
    }

    const result = await reorderCategoryTable(
      auth.supabase,
      "crypto_categories",
      orderedIds as string[],
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Crypto 카테고리 순서 저장 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
