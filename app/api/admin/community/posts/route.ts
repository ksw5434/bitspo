import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import {
  DISCUSSION_TOPIC_CATEGORIES,
  isCommunitySection,
  resolvePostSection,
  type CommunitySection,
} from "@/lib/community-sections";

/** 관리자 — 섹션별 게시글 목록·작성 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const sectionParam = request.nextUrl.searchParams.get("section");
  if (!sectionParam || !isCommunitySection(sectionParam)) {
    return NextResponse.json(
      { error: "section 쿼리(forum|discussion|guestbook)가 필요합니다." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("communities")
    .select(
      `
      id,
      title,
      content,
      category,
      section,
      tags,
      image_url,
      user_id,
      views,
      like_count,
      comment_count,
      created_at,
      updated_at
    `,
    )
    .eq("section", sectionParam)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("section")) {
      const { data: fallbackRows, error: fallbackError } = await auth.supabase
        .from("communities")
        .select(
          `
          id,
          title,
          content,
          category,
          tags,
          image_url,
          user_id,
          views,
          like_count,
          comment_count,
          created_at,
          updated_at
        `,
        )
        .order("created_at", { ascending: false });

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      const filtered = (fallbackRows ?? []).filter(
        (row) => resolvePostSection(row) === sectionParam,
      );
      return NextResponse.json({ data: filtered });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const {
    section,
    title,
    content,
    category,
    tags,
    image_url,
  } = body as {
    section?: string;
    title?: string;
    content?: string;
    category?: string | null;
    tags?: string[];
    image_url?: string | null;
  };

  if (!section || !isCommunitySection(section)) {
    return NextResponse.json(
      { error: "유효한 section(forum|discussion|guestbook)이 필요합니다." },
      { status: 400 },
    );
  }

  if (section === "guestbook") {
    return NextResponse.json(
      { error: "방명록은 회원이 공개 페이지에서 작성합니다." },
      { status: 400 },
    );
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const resolvedCategory =
    section === "discussion"
      ? category?.trim() || DISCUSSION_TOPIC_CATEGORIES[0]
      : category?.trim() || "Forum";

  const insertPayload: Record<string, unknown> = {
    title: title.trim(),
    content: content.trim(),
    category: resolvedCategory,
    section: section as CommunitySection,
    tags: Array.isArray(tags) && tags.length > 0 ? tags : [],
    image_url: image_url?.trim() || null,
    user_id: auth.user.id,
  };

  const { data, error } = await auth.supabase
    .from("communities")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    if (error.message?.includes("section")) {
      const fallback = { ...insertPayload };
      delete fallback.section;
      const retry = await auth.supabase
        .from("communities")
        .insert(fallback)
        .select()
        .single();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({ data: retry.data });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
