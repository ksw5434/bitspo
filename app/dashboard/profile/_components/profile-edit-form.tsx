"use client";

import { useState, useEffect } from "react";
import {
  updateProfile,
  type Profile,
} from "@/lib/supabase/profile-helpers-client";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Loader2,
  Save,
  X,
  Twitter,
  Linkedin,
  Github,
  Briefcase,
  Building2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileEditFormProps {
  profile: Profile | null;
}

/**
 * 프로필 편집 폼 컴포넌트
 * position, bio, affiliation, social_links 필드를 편집할 수 있습니다
 */
export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    position: profile?.position || "",
    bio: profile?.bio || "",
    affiliation: profile?.affiliation || "",
    social_links: {
      twitter: profile?.social_links?.twitter || "",
      linkedin: profile?.social_links?.linkedin || "",
      github: profile?.social_links?.github || "",
    },
  });

  // 프로필이 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (profile) {
      setFormData({
        position: profile.position || "",
        bio: profile.bio || "",
        affiliation: profile.affiliation || "",
        social_links: {
          twitter: profile.social_links?.twitter || "",
          linkedin: profile.social_links?.linkedin || "",
          github: profile.social_links?.github || "",
        },
      });
    }
  }, [profile]);

  // 입력 필드 변경 핸들러
  const handleInputChange = (
    field: "position" | "bio" | "affiliation",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 소셜 링크 변경 핸들러
  const handleSocialLinkChange = (
    platform: "twitter" | "linkedin" | "github",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  // URL 유효성 검사 (간단한 검증)
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // 빈 값은 허용
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 폼 저장 핸들러
  const handleSave = async () => {
    // URL 유효성 검사
    const socialLinks = formData.social_links;
    if (
      (socialLinks.twitter && !isValidUrl(socialLinks.twitter)) ||
      (socialLinks.linkedin && !isValidUrl(socialLinks.linkedin)) ||
      (socialLinks.github && !isValidUrl(socialLinks.github))
    ) {
      alert("올바른 URL 형식을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setErrorMessage(null);

      // 빈 문자열을 null로 변환
      const socialLinksToSave = Object.keys(socialLinks).reduce((acc, key) => {
        const value = socialLinks[key as keyof typeof socialLinks];
        if (value && value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      console.log("저장할 데이터:", {
        position: formData.position.trim() || null,
        bio: formData.bio.trim() || null,
        affiliation: formData.affiliation.trim() || null,
        social_links:
          Object.keys(socialLinksToSave).length > 0 ? socialLinksToSave : null,
      });

      const result = await updateProfile({
        position: formData.position.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        affiliation: formData.affiliation.trim() || undefined,
        social_links:
          Object.keys(socialLinksToSave).length > 0
            ? socialLinksToSave
            : undefined,
      });

      if (result.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        setErrorMessage(null);
        // 페이지 새로고침하여 업데이트된 프로필 반영
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const errorMsg = result.error || "알 수 없는 오류가 발생했습니다.";
        setErrorMessage(errorMsg);
        console.error("프로필 업데이트 실패:", errorMsg);
      }
    } catch (error) {
      console.error("프로필 업데이트 중 예외 발생:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "프로필 업데이트 중 오류가 발생했습니다.";
      setErrorMessage(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 취소 핸들러
  const handleCancel = () => {
    // 원래 값으로 복원
    if (profile) {
      setFormData({
        position: profile.position || "",
        bio: profile.bio || "",
        affiliation: profile.affiliation || "",
        social_links: {
          twitter: profile.social_links?.twitter || "",
          linkedin: profile.social_links?.linkedin || "",
          github: profile.social_links?.github || "",
        },
      });
    }
    setIsEditing(false);
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle>프로필 상세 정보</CardTitle>
            <CardDescription>
              직책, 소개, 소속 및 소셜 링크를 관리할 수 있습니다
            </CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              편집
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 직책 (Position) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              직책
            </label>
            {isEditing ? (
              <Input
                type="text"
                placeholder="예: 기자, 편집자, 프리랜서 등"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                disabled={isSaving}
              />
            ) : (
              <p className="text-base text-muted-foreground">
                {profile?.position || "직책 정보가 없습니다"}
              </p>
            )}
          </div>

          {/* 소속 (Affiliation) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              소속
            </label>
            {isEditing ? (
              <Input
                type="text"
                placeholder="예: 언론사명, 회사명 등"
                value={formData.affiliation}
                onChange={(e) =>
                  handleInputChange("affiliation", e.target.value)
                }
                disabled={isSaving}
              />
            ) : (
              <p className="text-base text-muted-foreground">
                {profile?.affiliation || "소속 정보가 없습니다"}
              </p>
            )}
          </div>

          {/* 자기소개 (Bio) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              자기소개
            </label>
            {isEditing ? (
              <Textarea
                placeholder="자기소개를 입력해주세요"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={isSaving}
                rows={4}
                className="resize-none"
              />
            ) : (
              <p className="text-base text-muted-foreground whitespace-pre-wrap">
                {profile?.bio || "자기소개가 없습니다"}
              </p>
            )}
          </div>

          {/* 소셜 링크 */}
          <div className="space-y-4">
            <label className="text-sm font-medium">소셜 링크</label>
            <div className="space-y-3">
              {/* Twitter */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Twitter className="w-3 h-3" />
                  Twitter
                </label>
                {isEditing ? (
                  <Input
                    type="url"
                    placeholder="https://twitter.com/username"
                    value={formData.social_links.twitter}
                    onChange={(e) =>
                      handleSocialLinkChange("twitter", e.target.value)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile?.social_links?.twitter ? (
                      <a
                        href={profile.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.social_links.twitter}
                      </a>
                    ) : (
                      "Twitter 링크가 없습니다"
                    )}
                  </p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </label>
                {isEditing ? (
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.social_links.linkedin}
                    onChange={(e) =>
                      handleSocialLinkChange("linkedin", e.target.value)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile?.social_links?.linkedin ? (
                      <a
                        href={profile.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.social_links.linkedin}
                      </a>
                    ) : (
                      "LinkedIn 링크가 없습니다"
                    )}
                  </p>
                )}
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Github className="w-3 h-3" />
                  GitHub
                </label>
                {isEditing ? (
                  <Input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.social_links.github}
                    onChange={(e) =>
                      handleSocialLinkChange("github", e.target.value)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile?.social_links?.github ? (
                      <a
                        href={profile.social_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.social_links.github}
                      </a>
                    ) : (
                      "GitHub 링크가 없습니다"
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 편집 모드일 때 저장/취소 버튼 */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          )}

          {/* 저장 성공 메시지 */}
          {saveSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                프로필이 성공적으로 업데이트되었습니다.
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
