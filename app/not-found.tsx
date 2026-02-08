import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

/**
 * 404 페이지 - 페이지를 찾을 수 없을 때 표시되는 페이지
 */
export default function NotFound() {
  return (
    <div className="bg-muted min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          {/* 404 숫자 표시 */}
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          
          {/* 에러 메시지 */}
          <h2 className="text-3xl font-semibold mb-4">
            페이지를 찾을 수 없습니다
          </h2>
          
          <p className="text-muted-foreground mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br />
            URL을 확인하시거나 아래 버튼을 통해 홈으로 돌아가세요.
          </p>
          
          {/* 홈으로 돌아가기 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/news">뉴스 보기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/community">커뮤니티 보기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
