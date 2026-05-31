import Link from "next/link";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  MOCK_TOP_COMMUNITIES,
  MOCK_TOP_POSTS,
  type TopCommunityItem,
  type TopPostItem,
} from "@/lib/community-sidebar-mock";

interface CommunitySidebarProps {
  /** 실제 인기 게시물 (없으면 목업 사용) */
  topPosts?: TopPostItem[];
  /** Top Communities 목록 (기본: 목업) */
  topCommunities?: TopCommunityItem[];
  className?: string;
}

/**
 * Community 페이지 공통 사이드바
 * Top Communities + Top Posts
 */
export function CommunitySidebar({
  topPosts,
  topCommunities = MOCK_TOP_COMMUNITIES,
  className = "",
}: CommunitySidebarProps) {
  const displayedTopPosts =
    topPosts && topPosts.length > 0 ? topPosts.slice(0, 5) : MOCK_TOP_POSTS;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Top Communities */}
      <section className="rounded-lg bg-card py-4">
        <h2 className="mb-4 px-4 text-2xl font-bold">Top Communities</h2>
        <ul className="space-y-1 px-2">
          {topCommunities.map((community) => (
            <li key={community.id}>
              <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-muted">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                    {community.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {community.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {community.memberCountLabel} members
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 cursor-pointer"
                >
                  Join
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Top Posts */}
      <section className="rounded-lg bg-card py-4">
        <h2 className="mb-4 px-4 text-2xl font-bold">Top Posts</h2>
        <ul className="space-y-1 px-2">
          {displayedTopPosts.map((post, index) => {
            const postContent = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">
                    {post.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="size-3" />
                      {post.likes.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {post.comments.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            );

            return (
              <li key={post.id}>
                {post.href && post.href !== "#" ? (
                  <Link
                    href={post.href}
                    className="flex cursor-pointer gap-3 rounded-md p-2 transition-colors hover:bg-muted"
                  >
                    {postContent}
                  </Link>
                ) : (
                  <div className="flex gap-3 rounded-md p-2">{postContent}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
