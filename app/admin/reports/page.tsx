import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

export default function AdminReportsPage() {
  // TODO: 신고 테이블(예: reports)과 연결해 처리/제재 플로우를 구현
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">신고/제재</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          신고 목록, 처리 상태 변경, 제재(차단/삭제) 기능을 여기에 추가할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}

