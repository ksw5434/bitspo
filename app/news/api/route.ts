import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncNewsBetCategories } from "@/lib/news-bet-sync";
import { syncNewsCryptoCategories } from "@/lib/news-crypto-sync";
import { syncNewsSportsCategories } from "@/lib/news-sports-sync";

/**
 * 뉴스 목록 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 뉴스 목록 조회 (최신순, 카테고리 포함)
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("뉴스 조회 오류:", error);
      return NextResponse.json(
        { error: "뉴스를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: news || [] });
  } catch (error) {
    console.error("뉴스 조회 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 뉴스 생성 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const {
      headline,
      content,
      image_url,
      category_ids,
      sports_category_ids,
      publish_to_sports,
      crypto_category_ids,
      publish_to_crypto,
      bet_category_ids,
      publish_to_bet,
    } = body;

    // 필수 필드 검증
    if (!headline || headline.trim() === "") {
      return NextResponse.json(
        { error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 뉴스 생성
    const insertPayload: Record<string, unknown> = {
      headline: headline.trim(),
      content: content?.trim() || null,
      image_url: image_url?.trim() || null,
      author_id: user.id,
    };

    if (publish_to_sports === true) {
      insertPayload.is_pick = true;
    }

    if (publish_to_crypto === true) {
      insertPayload.publish_to_crypto = true;
    }

    if (publish_to_bet === true) {
      insertPayload.publish_to_bet = true;
    }

    let { data: news, error } = await supabase
      .from("news")
      .insert(insertPayload)
      .select()
      .single();

    // is_pick / publish_to_crypto 컬럼 미적용 시 단계적 재시도
    if (error?.message?.includes("is_pick")) {
      delete insertPayload.is_pick;
      ({ data: news, error } = await supabase
        .from("news")
        .insert(insertPayload)
        .select()
        .single());
    }

    if (error?.message?.includes("publish_to_crypto")) {
      delete insertPayload.publish_to_crypto;
      ({ data: news, error } = await supabase
        .from("news")
        .insert(insertPayload)
        .select()
        .single());
    }

    if (error?.message?.includes("publish_to_bet")) {
      delete insertPayload.publish_to_bet;
      ({ data: news, error } = await supabase
        .from("news")
        .insert(insertPayload)
        .select()
        .single());
    }

    if (error) {
      console.error("뉴스 생성 오류:", error);
      return NextResponse.json(
        {
          error: error.message?.includes("is_pick")
            ? "news.is_pick 컬럼이 없습니다. npm run db:push 를 실행해 주세요."
            : error.message?.includes("publish_to_crypto")
              ? "news.publish_to_crypto 컬럼이 없습니다. npm run db:push 를 실행해 주세요."
              : error.message?.includes("publish_to_bet")
                ? "news.publish_to_bet 컬럼이 없습니다. npm run db:push 를 실행해 주세요."
                : "뉴스 생성에 실패했습니다.",
        },
        { status: 500 },
      );
    }

    // 카테고리 연결 처리
    if (
      category_ids &&
      Array.isArray(category_ids) &&
      category_ids.length > 0
    ) {
      // 유효한 카테고리 ID인지 확인
      const { data: validCategories } = await supabase
        .from("categories")
        .select("id")
        .in("id", category_ids);

      if (validCategories && validCategories.length > 0) {
        // 뉴스-카테고리 관계 생성
        const newsCategories = validCategories.map((category) => ({
          news_id: news.id,
          category_id: category.id,
        }));

        const { error: categoryError } = await supabase
          .from("news_categories")
          .insert(newsCategories);

        if (categoryError) {
          console.error("카테고리 연결 오류:", categoryError);
          // 뉴스는 생성되었지만 카테고리 연결 실패 - 경고만 표시
        }
      }
    }

    await syncNewsSportsCategories(supabase, news.id, sports_category_ids);
    await syncNewsCryptoCategories(supabase, news.id, crypto_category_ids);
    await syncNewsBetCategories(supabase, news.id, bet_category_ids);

    return NextResponse.json({ data: news }, { status: 201 });
  } catch (error) {
    console.error("뉴스 생성 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
