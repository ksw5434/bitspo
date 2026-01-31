import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 뉴스 개별 조회 (GET)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const newsId = id;

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 뉴스 조회 (카테고리 포함)
    const { data: news, error } = await supabase
      .from("news")
      .select(
        `
        *,
        news_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `
      )
      .eq("id", newsId)
      .single();

    if (error) {
      console.error("뉴스 조회 오류:", error);
      return NextResponse.json(
        { error: "뉴스를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!news) {
      return NextResponse.json(
        { error: "뉴스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error("뉴스 조회 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 뉴스 수정 (PUT)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const newsId = id;

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { headline, content, image_url, category_ids } = body;

    // 필수 필드 검증
    if (!headline || headline.trim() === "") {
      return NextResponse.json(
        { error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 뉴스 수정
    const { data: news, error } = await supabase
      .from("news")
      .update({
        headline: headline.trim(),
        content: content?.trim() || null,
        image_url: image_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsId)
      .select()
      .single();

    if (error) {
      console.error("뉴스 수정 오류:", error);
      return NextResponse.json(
        { error: "뉴스 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!news) {
      return NextResponse.json(
        { error: "뉴스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 카테고리 연결 업데이트 처리
    if (category_ids !== undefined) {
      // 기존 카테고리 관계 삭제
      const { error: deleteError } = await supabase
        .from("news_categories")
        .delete()
        .eq("news_id", newsId);

      if (deleteError) {
        console.error("기존 카테고리 삭제 오류:", deleteError);
      }

      // 새로운 카테고리 연결 생성
      if (Array.isArray(category_ids) && category_ids.length > 0) {
        // 유효한 카테고리 ID인지 확인
        const { data: validCategories } = await supabase
          .from("categories")
          .select("id")
          .in("id", category_ids);

        if (validCategories && validCategories.length > 0) {
          // 뉴스-카테고리 관계 생성
          const newsCategories = validCategories.map((category) => ({
            news_id: newsId,
            category_id: category.id,
          }));

          const { error: categoryError } = await supabase
            .from("news_categories")
            .insert(newsCategories);

          if (categoryError) {
            console.error("카테고리 연결 오류:", categoryError);
            // 뉴스는 수정되었지만 카테고리 연결 실패 - 경고만 표시
          }
        }
      }
    }

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error("뉴스 수정 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 뉴스 삭제 (DELETE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const newsId = id;

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 뉴스 삭제
    const { error } = await supabase.from("news").delete().eq("id", newsId);

    if (error) {
      console.error("뉴스 삭제 오류:", error);
      return NextResponse.json(
        { error: "뉴스 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("뉴스 삭제 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
