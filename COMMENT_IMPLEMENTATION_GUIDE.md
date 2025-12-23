# 댓글 기능 구현 가이드

## 📋 구현 절차 요약

### 1단계: 데이터베이스 스키마 생성 ✅

**파일**: `lib/supabase/news_comments.sql`

1. Supabase 대시보드 → SQL Editor로 이동
2. `news_comments.sql` 파일의 내용을 복사하여 실행
3. 다음 테이블들이 생성됩니다:
   - `news_comments`: 댓글 본문 저장
   - `news_comment_likes`: 댓글 좋아요 저장 (공감순 정렬용)

**주요 기능**:
- 댓글 작성/수정/삭제 (본인 댓글만)
- 댓글 좋아요 기능
- 자동 좋아요 개수 업데이트
- RLS 정책으로 보안 처리

---

### 2단계: 프론트엔드 타입 정의

**파일**: `app/news/[id]/page.tsx`

다음 타입들을 추가해야 합니다:

```typescript
// 댓글 타입 정의
interface Comment {
  id: string;
  news_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  // 조인된 사용자 정보
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  // 현재 사용자가 좋아요를 눌렀는지 여부
  user_liked?: boolean;
}

// 댓글 정렬 타입
type CommentSortType = "latest" | "likes";
```

---

### 3단계: 상태 관리 추가

**파일**: `app/news/[id]/page.tsx`

다음 상태들을 추가해야 합니다:

```typescript
const [comments, setComments] = useState<Comment[]>([]);
const [commentText, setCommentText] = useState("");
const [isSubmittingComment, setIsSubmittingComment] = useState(false);
const [commentSortType, setCommentSortType] = useState<CommentSortType>("latest");
const [currentUser, setCurrentUser] = useState<any>(null);
```

---

### 4단계: 댓글 조회 함수 구현

**파일**: `app/news/[id]/page.tsx`

```typescript
// 댓글 목록 조회 함수
const loadComments = async () => {
  try {
    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    setCurrentUser(user);

    // 댓글 조회 (사용자 정보와 함께)
    let query = supabase
      .from("news_comments")
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq("news_id", newsId);

    // 정렬 타입에 따라 정렬
    if (commentSortType === "latest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("like_count", { ascending: false });
    }

    const { data: commentsData, error } = await query;

    if (error) {
      console.error("댓글 조회 오류:", error);
      return;
    }

    // 현재 사용자가 좋아요를 눌렀는지 확인
    if (user && commentsData) {
      const commentIds = commentsData.map((c) => c.id);
      const { data: likesData } = await supabase
        .from("news_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

      const likedCommentIds = new Set(
        likesData?.map((l) => l.comment_id) || []
      );

      // 댓글에 user_liked 속성 추가
      const commentsWithLikes = commentsData.map((comment) => ({
        ...comment,
        user_liked: likedCommentIds.has(comment.id),
      }));

      setComments(commentsWithLikes || []);
    } else {
      setComments(commentsData || []);
    }
  } catch (error) {
    console.error("댓글 로드 오류:", error);
  }
};
```

---

### 5단계: 댓글 작성 함수 구현

**파일**: `app/news/[id]/page.tsx`

```typescript
// 댓글 작성 함수
const handleSubmitComment = async () => {
  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/auth/login");
    return;
  }

  // 댓글 내용 검증
  const trimmedContent = commentText.trim();
  if (!trimmedContent || trimmedContent.length === 0) {
    showToast("댓글 내용을 입력해주세요.", "error");
    return;
  }

  if (trimmedContent.length > 1000) {
    showToast("댓글은 1000자 이하로 작성해주세요.", "error");
    return;
  }

  try {
    setIsSubmittingComment(true);

    // 댓글 삽입
    const { data: newComment, error } = await supabase
      .from("news_comments")
      .insert({
        news_id: newsId,
        user_id: user.id,
        content: trimmedContent,
      })
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      console.error("댓글 작성 오류:", error);
      showToast("댓글 작성에 실패했습니다.", "error");
      return;
    }

    // 성공 시 댓글 목록에 추가하고 입력창 초기화
    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
    showToast("댓글이 작성되었습니다.", "success");
  } catch (error) {
    console.error("댓글 작성 중 오류:", error);
    showToast("댓글 작성 중 오류가 발생했습니다.", "error");
  } finally {
    setIsSubmittingComment(false);
  }
};
```

---

### 6단계: 댓글 삭제 함수 구현

**파일**: `app/news/[id]/page.tsx`

```typescript
// 댓글 삭제 함수
const handleDeleteComment = async (commentId: string) => {
  if (!confirm("댓글을 삭제하시겠습니까?")) {
    return;
  }

  try {
    const { error } = await supabase
      .from("news_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 오류:", error);
      showToast("댓글 삭제에 실패했습니다.", "error");
      return;
    }

    // 성공 시 댓글 목록에서 제거
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    showToast("댓글이 삭제되었습니다.", "success");
  } catch (error) {
    console.error("댓글 삭제 중 오류:", error);
    showToast("댓글 삭제 중 오류가 발생했습니다.", "error");
  }
};
```

---

### 7단계: 댓글 좋아요 함수 구현

**파일**: `app/news/[id]/page.tsx`

```typescript
// 댓글 좋아요 토글 함수
const handleToggleCommentLike = async (commentId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/auth/login");
    return;
  }

  try {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const isLiked = comment.user_liked;

    if (isLiked) {
      // 좋아요 취소
      const { error } = await supabase
        .from("news_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (error) {
        console.error("좋아요 취소 오류:", error);
        return;
      }

      // 로컬 상태 업데이트
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: Math.max(0, c.like_count - 1), user_liked: false }
            : c
        )
      );
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from("news_comment_likes")
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) {
        console.error("좋아요 추가 오류:", error);
        return;
      }

      // 로컬 상태 업데이트
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: c.like_count + 1, user_liked: true }
            : c
        )
      );
    }
  } catch (error) {
    console.error("좋아요 처리 중 오류:", error);
  }
};
```

---

### 8단계: 정렬 함수 구현

**파일**: `app/news/[id]/page.tsx`

```typescript
// 댓글 정렬 변경 함수
const handleSortChange = (sortType: CommentSortType) => {
  setCommentSortType(sortType);
  // 정렬 변경 시 댓글 다시 로드
  loadComments();
};
```

---

### 9단계: useEffect에서 댓글 로드

**파일**: `app/news/[id]/page.tsx`

기존 `useEffect`에 댓글 로드 함수를 추가:

```typescript
useEffect(() => {
  const loadNewsDetail = async () => {
    // ... 기존 코드 ...
    
    // 댓글 로드
    await loadComments();
  };

  loadNewsDetail();
}, [newsId, supabase, commentSortType]); // commentSortType 추가
```

---

### 10단계: UI 업데이트

**파일**: `app/news/[id]/page.tsx`

댓글 섹션(1027-1057줄)을 다음으로 교체:

```typescript
{/* 댓글 섹션 */}
<div className="border-t pt-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-4">
      <h3 className="text-lg font-semibold">댓글 {comments.length}</h3>
      <div className="flex gap-2">
        <Button
          variant={commentSortType === "likes" ? "default" : "ghost"}
          size="sm"
          className="h-8"
          onClick={() => handleSortChange("likes")}
        >
          공감순
        </Button>
        <Button
          variant={commentSortType === "latest" ? "default" : "ghost"}
          size="sm"
          className="h-8"
          onClick={() => handleSortChange("latest")}
        >
          최신순
        </Button>
      </div>
    </div>
  </div>

  {/* 댓글 작성 영역 */}
  {currentUser ? (
    <div className="mb-4">
      <Textarea
        placeholder="댓글을 남겨보세요"
        className="min-h-[100px]"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        disabled={isSubmittingComment}
      />
      <div className="flex justify-end mt-2">
        <Button
          onClick={handleSubmitComment}
          disabled={isSubmittingComment || !commentText.trim()}
          size="sm"
        >
          {isSubmittingComment ? "작성 중..." : "댓글 작성"}
        </Button>
      </div>
    </div>
  ) : (
    <div className="mb-4">
      <Textarea
        placeholder="로그인 후 댓글을 남겨보세요"
        className="min-h-[100px]"
        disabled
        onClick={() => router.push("/auth/login")}
        className="cursor-pointer"
      />
    </div>
  )}

  {/* 댓글 목록 */}
  {comments.length === 0 ? (
    <div className="flex justify-center py-8">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          아직 댓글이 없습니다.
        </p>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-b pb-4 last:border-b-0"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  {(comment.profiles?.full_name ||
                    comment.profiles?.email.split("@")[0] ||
                    "U")[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {comment.profiles?.full_name ||
                    comment.profiles?.email.split("@")[0] ||
                    "익명"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            </div>
            {currentUser?.id === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => handleDeleteComment(comment.id)}
              >
                삭제
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleToggleCommentLike(comment.id)}
            >
              <Heart
                className={`h-4 w-4 mr-1 ${
                  comment.user_liked
                    ? "text-primary fill-primary"
                    : "text-muted-foreground"
                }`}
              />
              공감 {comment.like_count}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## ✅ 체크리스트

- [ ] 1단계: Supabase에서 `news_comments.sql` 실행
- [ ] 2단계: 타입 정의 추가
- [ ] 3단계: 상태 관리 추가
- [ ] 4단계: 댓글 조회 함수 구현
- [ ] 5단계: 댓글 작성 함수 구현
- [ ] 6단계: 댓글 삭제 함수 구현
- [ ] 7단계: 댓글 좋아요 함수 구현
- [ ] 8단계: 정렬 함수 구현
- [ ] 9단계: useEffect에 댓글 로드 추가
- [ ] 10단계: UI 업데이트

---

## 🔍 참고사항

1. **뉴스 반응 기능 참고**: 기존 `news_reactions` 구현 패턴을 참고하면 쉽게 구현할 수 있습니다.

2. **에러 처리**: 네트워크 오류, 권한 오류 등을 적절히 처리해야 합니다.

3. **성능 최적화**: 
   - 댓글이 많을 경우 페이지네이션 고려
   - 실시간 업데이트가 필요하면 Supabase Realtime 사용 고려

4. **보안**: 
   - RLS 정책이 제대로 설정되어 있는지 확인
   - 클라이언트 사이드 검증 외에도 서버 사이드 검증 필요 (필요시 API Route 추가)

5. **UX 개선**:
   - 댓글 작성 중 로딩 상태 표시
   - 댓글 삭제 확인 다이얼로그
   - 댓글 수정 기능 추가 (선택사항)




