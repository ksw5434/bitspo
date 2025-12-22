import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 커뮤니티 개별 조회 (GET)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const communityId = id;

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

    // 커뮤니티 조회
    const { data: community, error } = await supabase
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .single();

    if (error) {
      console.error("커뮤니티 조회 오류:", error);
      return NextResponse.json(
        { error: "커뮤니티 게시글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!community) {
      return NextResponse.json(
        { error: "커뮤니티 게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: community });
  } catch (error) {
    console.error("커뮤니티 조회 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 커뮤니티 수정 (PUT)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const communityId = id;

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
    const { title, content, category, tags, image_url } = body;

    // 필수 필드 검증
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 커뮤니티 수정
    const { data: community, error } = await supabase
      .from("communities")
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        tags: tags && Array.isArray(tags) && tags.length > 0 ? tags : [],
        image_url: image_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", communityId)
      .select()
      .single();

    if (error) {
      console.error("커뮤니티 수정 오류:", error);
      return NextResponse.json(
        { error: "커뮤니티 게시글 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!community) {
      return NextResponse.json(
        { error: "커뮤니티 게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: community });
  } catch (error) {
    console.error("커뮤니티 수정 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 커뮤니티 삭제 (DELETE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const communityId = id;

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

    // 커뮤니티 삭제
    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", communityId);

    if (error) {
      console.error("커뮤니티 삭제 오류:", error);
      return NextResponse.json(
        { error: "커뮤니티 게시글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("커뮤니티 삭제 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


