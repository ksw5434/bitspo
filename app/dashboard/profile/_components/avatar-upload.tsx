"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/supabase/profile-helpers-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { Upload, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  userName: string | null;
  userEmail: string;
}

/**
 * 아바타 업로드 컴포넌트
 */
export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  userEmail,
}: AvatarUploadProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 이름 또는 이메일에서 이니셜 추출
  const getUserInitials = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return "U";
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 허용된 이미지 확장자 목록
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      alert(
        `지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedExtensions.join(
          ", "
        )}`
      );
      return;
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setUploadSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드 및 프로필 업데이트 핸들러
  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadSuccess(false);

      // 파일명 생성 (중복 방지를 위해 타임스탬프와 랜덤 문자열 사용)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("이미지 업로드 오류:", uploadError);

        // Storage 버킷이 존재하지 않는 경우
        if (uploadError.message?.includes("Bucket not found")) {
          alert("Storage 버킷이 존재하지 않습니다. 관리자에게 문의해주세요.");
          return;
        }

        // 파일이 이미 존재하는 경우
        if (uploadError.message?.includes("already exists")) {
          alert("동일한 파일명이 이미 존재합니다. 다시 시도해주세요.");
          return;
        }

        alert(`이미지 업로드에 실패했습니다: ${uploadError.message}`);
        return;
      }

      // 공개 URL 생성
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

      if (!publicUrl) {
        alert("이미지 URL을 생성할 수 없습니다.");
        return;
      }

      // 프로필 업데이트
      const result = await updateProfile({
        avatar_url: publicUrl,
      });

      if (result.success) {
        setPreviewImage(publicUrl);
        setUploadSuccess(true);
        // 페이지 새로고침하여 업데이트된 프로필 반영
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        alert(`프로필 업데이트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("이미지 업로드 중 예외 발생:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="w-24 h-24">
        <AvatarImage
          src={previewImage || currentAvatarUrl || ""}
          alt={userName || "사용자 프로필"}
          className="object-cover"
        />
        <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
          {getUserInitials()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-muted-foreground mb-2">프로필 사진</p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={isUploading}
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                파일 선택
              </span>
            </Button>
          </label>
          {fileInputRef.current?.files?.[0] && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleImageUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  완료
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  업로드
                </>
              )}
            </Button>
          )}
        </div>
        {fileInputRef.current?.files?.[0] && (
          <p className="text-xs text-muted-foreground mt-2">
            선택된 파일: {fileInputRef.current.files[0].name} (
            {(fileInputRef.current.files[0].size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
        {uploadSuccess && (
          <p className="text-xs text-green-600 mt-2">
            프로필 사진이 성공적으로 업데이트되었습니다.
          </p>
        )}
      </div>
    </div>
  );
}
