import Link from "next/link";
import { Button } from "./ui/button";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

interface SectionPlaceholderPageProps {
  /** 페이지 제목 (영문 메뉴 라벨과 동일) */
  title: string;
  /** 섹션 설명 */
  description: string;
}

/**
 * 신규 섹션 준비 중 안내 페이지
 * 콘텐츠 연동 전까지 공통 레이아웃으로 표시
 */
export function SectionPlaceholderPage({
  title,
  description,
}: SectionPlaceholderPageProps) {
  const otherSections = MAIN_NAV_ITEMS.filter(
    (item) => item.label !== title,
  );

  return (
    <main className="container mx-auto px-2 py-16">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          <p className="text-sm text-muted-foreground/80">
            이 섹션은 준비 중입니다. 곧 콘텐츠가 제공될 예정입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/news">News 홈으로</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/community">Community</Link>
          </Button>
        </div>

        {otherSections.length > 0 && (
          <nav
            className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground border-t border-border pt-8"
            aria-label="다른 섹션"
          >
            {otherSections.map((item, index) => (
              <span key={item.path} className="inline-flex items-center gap-2">
                {index > 0 && (
                  <span className="text-muted-foreground/40" aria-hidden>
                    |
                  </span>
                )}
                <Link
                  href={item.path}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
      </div>
    </main>
  );
}
