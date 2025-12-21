import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile-helpers-server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { UserIcon, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { AvatarUpload } from "./_components/avatar-upload";
import { ProfileEditForm } from "./_components/profile-edit-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필 설정 - 비트스포",
  description: "프로필 정보를 확인하고 수정할 수 있는 페이지입니다.",
};

/**
 * 프로필 페이지
 * 로그인한 사용자만 접근 가능
 */
export default async function ProfilePage() {
  // 서버 사이드 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 사용자 인증 상태 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user || authError) {
    redirect("/auth/login");
  }

  // 사용자 프로필 정보 가져오기
  const profile = await getUserProfile(user.id);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">프로필</h1>
        <p className="text-muted-foreground">
          계정 정보를 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 프로필 정보 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>계정 기본 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 아바타 섹션 */}
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url || null}
              userName={profile?.name || null}
              userEmail={user.email || ""}
            />

            {/* 사용자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  이름
                </label>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base">{profile?.name || "이름 없음"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  이메일
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  가입일
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {profile?.updated_at && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    최근 업데이트
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-base">
                      {formatDate(profile.updated_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 상세 정보 편집 카드 */}
      <ProfileEditForm profile={profile} />

      {/* 계정 설정 카드 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>계정 설정</CardTitle>
          <CardDescription>계정 관련 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">비밀번호 변경</p>
                <p className="text-sm text-muted-foreground">
                  계정 보안을 위해 비밀번호를 변경하세요
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                변경 (준비 중)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 빠른 링크 */}
      <div className="mt-6 flex gap-4">
        <Link href="/dashboard">
          <Button variant="outline">대시보드로 돌아가기</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">홈으로</Button>
        </Link>
      </div>
    </div>
  );
}
