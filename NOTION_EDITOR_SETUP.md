# 노션 스타일 리치 텍스트 에디터 구현 가이드

노션처럼 자유자재로 글을 쓰고 그림을 넣을 수 있는 리치 텍스트 에디터를 구현하는 가이드입니다.

## 1단계: 필요한 라이브러리 설치

TipTap은 ProseMirror 기반의 현대적인 리치 텍스트 에디터입니다. 노션과 유사한 사용자 경험을 제공합니다.

```bash
# TipTap 핵심 패키지
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm

# 이미지 및 미디어 확장
npm install @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder

# 추가 유용한 확장 (선택사항)
npm install @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight

# 이미지 업로드를 위한 유틸리티
npm install react-dropzone

# HTML을 안전하게 렌더링하기 위한 라이브러리 (읽기 전용 뷰)
npm install html-react-parser
```

## 2단계: 데이터베이스 스키마 변경

현재 `content` 필드가 TEXT 타입인데, 리치 텍스트 에디터의 HTML/JSON 데이터를 저장하기 위해 변경이 필요합니다.

### 옵션 1: JSONB 타입 사용 (권장)

- 구조화된 데이터 저장 가능
- 검색 및 쿼리 최적화 가능
- 이미지, 블록 등 메타데이터 저장 용이

### 옵션 2: TEXT 타입 유지 (HTML 저장)

- 간단한 구현
- 기존 데이터와 호환성 유지

**권장: JSONB 타입으로 변경**

```sql
-- ============================================
-- 뉴스 테이블 스키마 업데이트
-- ============================================

-- 1. content 필드를 JSONB로 변경 (기존 데이터는 유지)
ALTER TABLE public.news
ALTER COLUMN content TYPE JSONB
USING content::jsonb;

-- 만약 기존 데이터가 있다면, 빈 JSON 객체로 변환
-- UPDATE public.news SET content = '{}'::jsonb WHERE content IS NULL;

-- 2. (선택사항) 이미지 저장을 위한 별도 테이블 생성
CREATE TABLE IF NOT EXISTS public.news_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS news_images_news_id_idx ON public.news_images(news_id);
CREATE INDEX IF NOT EXISTS news_images_order_idx ON public.news_images(order_index);

-- RLS 정책 설정
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 이미지를 조회할 수 있습니다
CREATE POLICY "Anyone can view news images"
  ON public.news_images
  FOR SELECT
  USING (true);

-- 관리자만 이미지를 생성할 수 있습니다
CREATE POLICY "Only admins can insert news images"
  ON public.news_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자만 이미지를 수정/삭제할 수 있습니다
CREATE POLICY "Only admins can update news images"
  ON public.news_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete news images"
  ON public.news_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### 대안: TEXT 타입 유지 (HTML 저장)

기존 구조를 유지하면서 HTML로 저장하는 방법:

```sql
-- content 필드는 TEXT로 유지
-- TipTap에서 생성한 HTML을 그대로 저장
-- 변경 불필요
```

## 3단계: 이미지 업로드 API 생성

Supabase Storage를 사용하여 이미지를 업로드합니다.

```typescript
// app/dashboard/news/api/upload-image/route.ts
```

## 4단계: TipTap 에디터 컴포넌트 생성

```typescript
// app/_components/rich-text-editor.tsx
```

## 5단계: 뉴스 작성/수정 페이지 업데이트

기존 Textarea를 RichTextEditor로 교체합니다.

## 구현 순서

1. ✅ 라이브러리 설치
2. ✅ 데이터베이스 스키마 변경
3. ✅ 이미지 업로드 API 생성
4. ✅ RichTextEditor 컴포넌트 생성
5. ⏳ 뉴스 작성/수정 페이지 업데이트
6. ⏳ 뉴스 상세 페이지에서 리치 텍스트 렌더링

## 5단계: Supabase Storage 버킷 생성

이미지 업로드를 위해 Supabase Storage에 버킷을 생성해야 합니다.

1. Supabase 대시보드에서 **Storage** 메뉴로 이동
2. **New bucket** 클릭
3. 버킷 이름: `news-images`
4. Public bucket: ✅ 체크 (공개 접근 허용)
5. File size limit: 10MB (또는 원하는 크기)
6. Allowed MIME types: `image/*`
7. **Create bucket** 클릭

## 6단계: CSS 스타일 추가

`app/globals.css`에 TipTap 에디터 스타일을 추가합니다:

```css
/* TipTap 에디터 스타일 */
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.ProseMirror a {
  color: hsl(var(--primary));
  text-decoration: underline;
}

.ProseMirror h1 {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.875rem 0;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0.75rem 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror blockquote {
  border-left: 4px solid hsl(var(--border));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}
```

## 7단계: 뉴스 페이지에서 RichTextEditor 사용

기존 `Textarea`를 `RichTextEditor`로 교체합니다:

```typescript
// app/dashboard/news/page.tsx에서
import { RichTextEditor } from "@/app/_components/rich-text-editor";

// 기존 Textarea 대신 사용
<RichTextEditor
  content={formData.content}
  onChange={(html) => setFormData({ ...formData, content: html })}
  placeholder="뉴스 내용을 입력하세요..."
/>;
```

## 8단계: 뉴스 상세 페이지에서 HTML 렌더링

상세 페이지에서 저장된 HTML을 안전하게 렌더링합니다:

```typescript
// app/dashboard/news/[id]/page.tsx에서
import parse from "html-react-parser";

// 기존 내용 표시 부분을 다음과 같이 변경
<div className="prose prose-sm max-w-none">{parse(news.content || "")}</div>;
```

## 주의사항

1. **데이터베이스 마이그레이션**: 기존 데이터가 있다면 마이그레이션 SQL을 실행하기 전에 백업하세요.
2. **Storage 권한**: Supabase Storage 버킷의 RLS 정책을 확인하세요.
3. **이미지 최적화**: 프로덕션에서는 이미지 리사이징 및 최적화를 고려하세요.
4. **XSS 방지**: HTML 렌더링 시 `html-react-parser`와 함께 `DOMPurify`를 사용하는 것을 권장합니다.

## 실제 사용 예시

### 뉴스 작성 페이지에서 사용

```typescript
// app/dashboard/news/page.tsx
import { RichTextEditor } from "@/app/_components/rich-text-editor";

// formData 상태에서 content를 HTML로 저장
const [formData, setFormData] = useState({
  headline: "",
  content: "", // HTML 문자열로 저장
  image_url: "",
});

// 폼에서 RichTextEditor 사용
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <label htmlFor="headline" className="block text-sm font-medium mb-2">
      제목 <span className="text-destructive">*</span>
    </label>
    <Input
      id="headline"
      value={formData.headline}
      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
      placeholder="뉴스 제목을 입력하세요"
      required
    />
  </div>

  <div>
    <label htmlFor="content" className="block text-sm font-medium mb-2">
      내용
    </label>
    <RichTextEditor
      content={formData.content}
      onChange={(html) => setFormData({ ...formData, content: html })}
      placeholder="뉴스 내용을 입력하세요..."
    />
  </div>

  {/* 나머지 폼 요소들... */}
</form>;
```

### 뉴스 상세 페이지에서 렌더링

```typescript
// app/dashboard/news/[id]/page.tsx
import parse from "html-react-parser";

// 뉴스 내용 표시
<div className="mb-6">
  <div className="prose prose-sm max-w-none">{parse(news.content || "")}</div>
</div>;
```

## 추가 개선 사항

- [ ] 이미지 리사이징 기능 추가
- [ ] 코드 블록 지원 추가
- [ ] 테이블 지원 추가
- [ ] 드래그 앤 드롭으로 이미지 순서 변경
- [ ] 자동 저장 기능 (Draft)
- [ ] XSS 방지를 위한 DOMPurify 통합

## 문제 해결

### 이미지 업로드가 안 될 때

1. Supabase Storage 버킷이 생성되었는지 확인
2. 버킷의 RLS 정책이 올바르게 설정되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 에디터가 표시되지 않을 때

1. 라이브러리가 올바르게 설치되었는지 확인: `npm list @tiptap/react`
2. 브라우저 콘솔에서 에러 메시지 확인
3. CSS 스타일이 올바르게 적용되었는지 확인

### 저장된 내용이 표시되지 않을 때

1. 데이터베이스의 content 필드 타입 확인 (TEXT 또는 JSONB)
2. HTML이 올바르게 저장되었는지 확인
3. html-react-parser가 올바르게 설치되었는지 확인
