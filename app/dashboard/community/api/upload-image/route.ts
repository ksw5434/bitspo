import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 이미지 업로드 API
 * 커뮤니티 게시글의 이미지를 업로드할 때 사용합니다
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

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    // 허용된 이미지 확장자 목록
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        {
          error: `지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedExtensions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 10MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 파일명 생성 (중복 방지를 위해 타임스탬프와 랜덤 문자열 사용)
    // 사용자 ID별로 폴더를 구분하여 관리
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${user.id}/${timestamp}-${randomString}.${fileExt}`;

    // Supabase Storage에 업로드
    // Storage 버킷 이름: 'community-image' (Supabase 대시보드에서 생성 필요)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("community-image")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("이미지 업로드 오류:", uploadError);

      // Storage 버킷이 존재하지 않는 경우
      if (uploadError.message?.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error:
              "Storage 버킷이 존재하지 않습니다. Supabase 대시보드에서 'community-image' 버킷을 생성해주세요.",
          },
          { status: 500 }
        );
      }

      // 파일이 이미 존재하는 경우 (upsert: false이므로 발생 가능)
      if (uploadError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "동일한 파일명이 이미 존재합니다. 다시 시도해주세요." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `이미지 업로드에 실패했습니다: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("community-image").getPublicUrl(uploadData.path);

    if (!publicUrl) {
      return NextResponse.json(
        { error: "이미지 URL을 생성할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: uploadData.path,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("이미지 업로드 중 예외 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


