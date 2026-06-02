"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CommunityPostEditForm,
  type AdminCommunityPost,
} from "../../../_components/community-post-edit-form";

export default function AdminCommunityForumEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<AdminCommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/admin/community/posts/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "로드 실패");
        if (!cancelled) setPost(json.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "로드 실패");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (error || !post) {
    return (
      <p className="text-sm text-destructive">{error ?? "글을 찾을 수 없습니다."}</p>
    );
  }

  return (
    <CommunityPostEditForm
      section="forum"
      post={post}
      listHref="/admin/community/forum"
      onSaved={() => router.push("/admin/community/forum")}
      onError={setError}
    />
  );
}
