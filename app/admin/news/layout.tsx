import { Suspense } from "react";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { NewsSubNav } from "./_components/news-sub-nav";

export default async function AdminNewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">News 글쓰기</h2>
        <p className="text-sm text-muted-foreground">
          카테고리를 추가하면 아래 탭과 사이드바 하위 메뉴에 자동으로 표시됩니다.
        </p>
      </div>

      <Suspense fallback={null}>
        <NewsSubNav variant="bar" />
      </Suspense>

      {children}
    </div>
  );
}
