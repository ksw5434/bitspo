"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommunityPostEditForm } from "../../_components/community-post-edit-form";

export default function AdminCommunityDiscussionNewPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <CommunityPostEditForm
        section="discussion"
        post={null}
        listHref="/admin/community/discussion"
        onSaved={() => router.push("/admin/community/discussion")}
        onError={setError}
      />
    </div>
  );
}
