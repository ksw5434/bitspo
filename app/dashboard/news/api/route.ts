import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 뉴스 목록 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 뉴스 목록 조회 (최신순)
    const { data: news, error } = await supabase
      .from("news")
      .select("*")
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
    const { headline, content, image_url } = body;

    // 필수 필드 검증
    if (!headline || headline.trim() === "") {
      return NextResponse.json(
        { error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 뉴스 생성
    const { data: news, error } = await supabase
      .from("news")
      .insert({
        headline: headline.trim(),
        content: content?.trim() || null,
        image_url: image_url?.trim() || null,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("뉴스 생성 오류:", error);
      return NextResponse.json(
        { error: "뉴스 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: news }, { status: 201 });
  } catch (error) {
    console.error("뉴스 생성 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

