import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile-helpers-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { UserIcon, Calendar, Mail, TrendingUp, Activity, BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드 - 비트스포",
  description: "계정 정보와 활동 통계를 확인할 수 있는 대시보드입니다.",
};

/**
 * 대시보드 페이지
 * 로그인한 사용자만 접근 가능
 */
export default async function DashboardPage() {
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

  // 가입일 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-muted-foreground">
          환영합니다! 여기서 계정 정보와 활동을 확인할 수 있습니다.
        </p>
      </div>

      {/* 사용자 프로필 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>계정 기본 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* 아바타 */}
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={profile?.avatar_url || ""}
                alt={profile?.name || "사용자 프로필"}
              />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            {/* 사용자 정보 */}
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-xl font-semibold">
                  {profile?.name || "이름 없음"}
                </h3>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>

              <div className="flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    가입일: {formatDate(user.created_at)}
                  </span>
                </div>
                {profile?.updated_at && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>
                      최근 업데이트: {formatDate(profile.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* 활동 통계 카드 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 활동</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              지금까지의 활동 수
            </p>
          </CardContent>
        </Card>

        {/* 활동 통계 카드 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성장률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              이번 달 성장률
            </p>
          </CardContent>
        </Card>

        {/* 활동 통계 카드 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">분석</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              데이터 분석 결과
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 작업 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/profile"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <UserIcon className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">프로필 수정</div>
                <div className="text-sm text-muted-foreground">
                  프로필 정보 업데이트
                </div>
              </div>
            </a>

            <a
              href="/community"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">커뮤니티</div>
                <div className="text-sm text-muted-foreground">
                  커뮤니티 활동 보기
                </div>
              </div>
            </a>

            <a
              href="/"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">뉴스 보기</div>
                <div className="text-sm text-muted-foreground">
                  최신 뉴스 확인
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


