import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, FileText, UserPlus } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { MetricCard } from "./_components/metric-card";
import { createClient } from "@/lib/supabase/server";

type RecentActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  href?: string;
};

function getKstStartOfTodayIsoString(): string {
  // KST(Asia/Seoul) 기준 오늘 00:00을 ISO로 변환 (서버 타임존 영향 제거)
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [{ value: year }, , { value: month }, , { value: day }] =
    formatter.formatToParts(new Date());

  // 예: 2026-06-02T00:00:00+09:00
  return `${year}-${month}-${day}T00:00:00+09:00`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 관리자 인증: 로그인 유저 + profiles.is_admin 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (adminProfileError || !adminProfile?.is_admin) {
    redirect("/dashboard");
  }

  const todayStartIso = getKstStartOfTodayIsoString();

  // 전체 회원 수
  const { count: totalUserCountRaw, error: totalUsersError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const totalUserCount = totalUsersError ? 0 : (totalUserCountRaw ?? 0);

  // 오늘 가입 수 (profiles.created_at 기준)
  const { count: todaySignupCountRaw, error: todaySignupError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStartIso);
  const todaySignupCount = todaySignupError ? 0 : (todaySignupCountRaw ?? 0);

  // 오늘 게시글 수 (커뮤니티 게시글: communities.created_at)
  const { count: todayCommunityPostCountRaw, error: todayCommunityPostError } =
    await supabase
      .from("communities")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStartIso);
  const todayCommunityPostCount = todayCommunityPostError
    ? 0
    : (todayCommunityPostCountRaw ?? 0);

  // 오늘 게시글 수 (뉴스: news.created_at) — 테이블이 없거나 권한이 없으면 0 처리
  let todayNewsPostCount = 0;
  try {
    const { count, error } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStartIso);
    if (!error) {
      todayNewsPostCount = count ?? 0;
    }
  } catch {
    todayNewsPostCount = 0;
  }

  const todayPostCount = todayCommunityPostCount + todayNewsPostCount;

  // 대기 신고 수 (reports 테이블 가정) — 없으면 0 처리
  let pendingReportCount = 0;
  try {
    const { count, error } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (!error) {
      pendingReportCount = count ?? 0;
    }
  } catch {
    pendingReportCount = 0;
  }

  const recentActivities: RecentActivityItem[] = [
    {
      id: "act_01",
      title: "신규 가입",
      description: `오늘 신규 가입 ${todaySignupCount.toLocaleString()}명`,
      createdAt: "방금 전",
      href: "/admin/users",
    },
    {
      id: "act_02",
      title: "신고 접수",
      description:
        pendingReportCount > 0
          ? `대기 중인 신고 ${pendingReportCount.toLocaleString()}건`
          : "대기 중인 신고가 없습니다.",
      createdAt: "10분 전",
      href: "/admin/reports",
    },
    {
      id: "act_03",
      title: "게시글 증가",
      description: `오늘 작성된 게시글 ${todayPostCount.toLocaleString()}건`,
      createdAt: "1시간 전",
      href: "/admin/analytics",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">요약</h2>
          <p className="text-sm text-muted-foreground">
            운영 현황을 빠르게 확인하고 필요한 작업으로 이동하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/reports">신고함 보기</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/users">회원 관리</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="전체 회원"
          value={totalUserCount.toLocaleString()}
          description="누적 가입자 수"
          icon={<Activity className="size-4" />}
        />
        <MetricCard
          title="오늘 가입"
          value={todaySignupCount.toLocaleString()}
          description="오늘 00:00 이후"
          icon={<UserPlus className="size-4" />}
        />
        <MetricCard
          title="오늘 게시글"
          value={todayPostCount.toLocaleString()}
          description="커뮤니티/뉴스 포함"
          icon={<FileText className="size-4" />}
        />
        <MetricCard
          title="대기 신고"
          value={pendingReportCount.toLocaleString()}
          description="처리 필요"
          icon={<AlertTriangle className="size-4" />}
          className={pendingReportCount > 0 ? "border-destructive/40" : undefined}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">최근 활동</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                최근 활동이 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {recentActivities.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt}
                      </span>
                      {item.href ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={item.href}>열기</Link>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">바로가기</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/users">회원 목록</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/reports">신고/제재</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/analytics">통계</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/news">News 글쓰기</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/sports">Sports 글쓰기</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/settings">관리자 설정</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

