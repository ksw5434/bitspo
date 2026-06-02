import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

export default function AdminAnalyticsPage() {
  // TODO: 방문/가입/활동 지표를 실제 데이터로 연결하고 차트 UI를 추가
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">통계</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          일/주/월 단위 지표(가입, 게시글, 신고 등)를 시각화하는 화면입니다.
        </p>
      </CardContent>
    </Card>
  );
}

