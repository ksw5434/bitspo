import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { UserIcon, Mail, Calendar, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

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

  // 사용자 이름 또는 이메일에서 이니셜 추출
  const getUserInitials = () => {
    if (profile?.name) {
      return profile.name.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

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
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={profile?.avatar_url || ""}
                  alt={profile?.name || "사용자 프로필"}
                />
                <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  프로필 사진
                </p>
                <Button variant="outline" size="sm" disabled>
                  사진 변경 (준비 중)
                </Button>
              </div>
            </div>

            {/* 사용자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  이름
                </label>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base">
                    {profile?.name || "이름 없음"}
                  </p>
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
                    <p className="text-base">{formatDate(profile.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계정 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 설정</CardTitle>
          <CardDescription>계정 관련 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">프로필 편집</p>
                <p className="text-sm text-muted-foreground">
                  이름 및 프로필 사진 변경
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                편집 (준비 중)
              </Button>
            </div>

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
          <Button variant="outline">
            대시보드로 돌아가기
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">
            홈으로
          </Button>
        </Link>
      </div>
    </div>
  );
}

