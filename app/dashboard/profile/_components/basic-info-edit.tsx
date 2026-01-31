"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/supabase/profile-helpers-client";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { UserIcon, Loader2, Save, X, Edit2 } from "lucide-react";

interface BasicInfoEditProps {
  currentName: string | null;
}

/**
 * 기본 정보 편집 컴포넌트
 * 이름 필드를 편집할 수 있습니다
 */
export function BasicInfoEdit({ currentName }: BasicInfoEditProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  // currentName prop이 변경되면 state 업데이트
  useEffect(() => {
    if (!isEditing) {
      setName(currentName || "");
    }
  }, [currentName, isEditing]);

  // 편집 모드 시작
  const handleEdit = () => {
    setIsEditing(true);
    setName(currentName || "");
    setErrorMessage(null);
    setSuccessMessage(false);
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setName(currentName || "");
    setErrorMessage(null);
    setSuccessMessage(false);
  };

  // 이름 저장
  const handleSave = async () => {
    // 이름 유효성 검사
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage("이름은 50자 이하로 입력해주세요.");
      return;
    }

    // 변경사항이 없으면 저장하지 않음
    if (trimmedName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(false);

      console.log("이름 업데이트 시작:", { 
        현재이름: currentName, 
        새이름: trimmedName 
      });

      const result = await updateProfile({
        name: trimmedName,
      });

      console.log("업데이트 결과:", result);

      if (result.success) {
        setSuccessMessage(true);
        setIsEditing(false);
        // 성공 메시지 표시 후 페이지 새로고침하여 업데이트된 프로필 반영
        setTimeout(() => {
          router.refresh();
          setSuccessMessage(false);
        }, 1500);
      } else {
        const errorMsg = result.error || "알 수 없는 오류가 발생했습니다.";
        setErrorMessage(errorMsg);
        console.error("이름 업데이트 실패:", errorMsg);
        // 에러 발생 시 편집 모드 유지
        setIsEditing(true);
      }
    } catch (error) {
      console.error("이름 업데이트 중 예외 발생:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "이름 업데이트 중 오류가 발생했습니다.";
      setErrorMessage(errorMsg);
      // 에러 발생 시 편집 모드 유지
      setIsEditing(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          이름
        </label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 px-2"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            편집
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              disabled={isSaving}
              className="flex-1"
              maxLength={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  저장
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              size="sm"
            >
              <X className="w-3 h-3 mr-1" />
              취소
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
          <p className="text-base">{currentName || "이름 없음"}</p>
        </div>
      )}

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-xs text-green-800 dark:text-green-200">
            이름이 성공적으로 업데이트되었습니다.
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-800 dark:text-red-200">
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
