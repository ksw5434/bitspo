import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { isCommunitySection } from "@/lib/community-sections";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { title, content, category, tags, image_url, section } = body as {
    title?: string;
    content?: string;
    category?: string | null;
    tags?: string[];
    image_url?: string | null;
    section?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    image_url: image_url?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (section && isCommunitySection(section)) {
    updatePayload.section = section;
    if (section === "discussion" && category?.trim()) {
      updatePayload.category = category.trim();
    } else if (section === "forum") {
      updatePayload.category = category?.trim() || "Forum";
    }
  } else if (category !== undefined) {
    updatePayload.category = category?.trim() || null;
  }

  const { data, error } = await auth.supabase
    .from("communities")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.message?.includes("section")) {
      const { section: _s, ...withoutSection } = updatePayload;
      const retry = await auth.supabase
        .from("communities")
        .update(withoutSection)
        .eq("id", id)
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { error } = await auth.supabase.from("communities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
