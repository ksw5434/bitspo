import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

export default function AdminUsersPage() {
  // TODO: Supabase users/profiles 테이블과 연결해 실제 회원 목록을 표시
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">회원 관리</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          회원 목록/검색/권한 관리 UI를 여기에 추가할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}

