import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

export default function AdminSettingsPage() {
  // TODO: 관리자 환경설정(예: 사이트 공지, 운영 정책, 접근 권한)을 연결
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">설정</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          관리자 설정 화면(운영 정책/권한/공지)을 여기에 추가할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}

