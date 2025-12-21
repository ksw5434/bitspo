import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 커뮤니티 이미지 업로드 API
 * 로그인한 사용자가 게시글에 이미지를 업로드할 때 사용합니다
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
        { error: "로그인이 필요합니다." },
        { status: 401 }
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

    // 파일명에서 확장자 추출
    let fileExt: string | undefined;
    const fileNameParts = file.name.split(".");
    if (fileNameParts.length > 1) {
      fileExt = fileNameParts.pop()?.toLowerCase();
    }

    // MIME 타입 검증 (image/로 시작하는 모든 이미지 타입 허용)
    const isImageMimeType = file.type && file.type.startsWith("image/");
    const isOctetStream = file.type === "application/octet-stream" || !file.type;

    // 이미지 파일인지 확인
    // 1. MIME 타입이 image/로 시작하거나
    // 2. MIME 타입이 없거나 application/octet-stream이고 확장자가 있는 경우
    if (!isImageMimeType && !isOctetStream) {
      return NextResponse.json(
        {
          error: "이미지 파일만 업로드할 수 있습니다.",
          details: `파일 타입: ${file.type || "없음"}`,
        },
        { status: 400 }
      );
    }

    // 확장자가 없는 경우 MIME 타입에서 추출 시도
    if (!fileExt && file.type) {
      const mimeTypeMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
        "image/x-icon": "ico",
        "image/vnd.microsoft.icon": "ico",
        "image/x-png": "png",
        "image/tiff": "tiff",
        "image/tif": "tiff",
        "image/heic": "heic",
        "image/heif": "heif",
        "image/avif": "avif",
        "image/apng": "apng",
      };
      fileExt = mimeTypeMap[file.type] || "jpg"; // 기본값은 jpg
    }

    // 확장자가 여전히 없는 경우 기본값 설정
    if (!fileExt) {
      fileExt = "jpg";
    }

    // 확장자 정규화 (jpeg -> jpg)
    const extensionMap: Record<string, string> = {
      jpeg: "jpg",
    };
    fileExt = extensionMap[fileExt] || fileExt;

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
    const fileName = `community/${user.id}/${timestamp}-${randomString}.${fileExt}`;

    // Supabase Storage에 업로드
    // Storage 버킷 이름: 'community-image' 또는 기존 버킷 사용
    // 버킷이 없으면 'news-image' 버킷 사용 (공용)
    const bucketName = "news-image"; // 또는 'community-image' 버킷 생성 후 사용

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
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
              "Storage 버킷이 존재하지 않습니다. Supabase 대시보드에서 버킷을 생성해주세요.",
          },
          { status: 500 }
        );
      }

      // 파일이 이미 존재하는 경우
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
    } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

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

