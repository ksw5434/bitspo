"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "./ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

/**
 * 리치 텍스트 에디터 컴포넌트
 * 노션 스타일의 에디터를 제공합니다
 */
interface RichTextEditorProps {
  content?: string; // HTML 문자열 또는 JSON 문자열
  onChange?: (content: string) => void; // 콘텐츠 변경 시 호출되는 콜백
  placeholder?: string; // 플레이스홀더 텍스트
  editable?: boolean; // 편집 가능 여부 (기본값: true)
}

export interface RichTextEditorRef {
  insertImage: (url: string) => void; // 이미지 URL을 에디터에 삽입
}

export const RichTextEditor = forwardRef<
  RichTextEditorRef,
  RichTextEditorProps
>(function RichTextEditor(
  {
    content = "",
    onChange,
    placeholder = "내용을 입력하세요...",
    editable = true,
  },
  ref,
) {
  // 클라이언트 마운트 상태 (Hydration 에러 방지)
  const [isMounted, setIsMounted] = useState(false);
  // 이미지 업로드 로딩 상태
  const [isUploading, setIsUploading] = useState(false);

  // 클라이언트에서만 마운트되도록 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 이미지 업로드 함수
  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/dashboard/news/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드에 실패했습니다.");
      }

      return result.url; // 업로드된 이미지 URL 반환
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      // alert 대신 콘솔에만 기록 (프로덕션에서는 토스트 메시지 사용 권장)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.";
      console.error(errorMessage);
      // 사용자에게 피드백을 제공하려면 여기에 토스트 메시지 추가
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 에디터 인스턴스 생성 (클라이언트에서만 초기화)
  const editor = useEditor({
    // 클라이언트에서만 에디터 생성
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // 기본 기능 활성화
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        // 이미지 확장 설정
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: isMounted ? content || "" : "",
    editable: isMounted ? editable : false,
    onUpdate: ({ editor }) => {
      // HTML로 변환하여 부모 컴포넌트에 전달
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      // 이미지 드래그 앤 드롭 처리
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageUpload(file).then((url) => {
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
            return true;
          }
        }
        return false;
      },
      // 이미지 붙여넣기 처리
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file).then((url) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // 에디터가 마운트되면 활성화 및 내용 설정
  useEffect(() => {
    if (isMounted && editor) {
      editor.setEditable(editable);
      if (content !== undefined) {
        const currentContent = editor.getHTML();
        // 내용이 실제로 변경된 경우에만 업데이트 (무한 루프 방지)
        if (currentContent !== content) {
          editor.commands.setContent(content || "");
        }
      }
    }
  }, [isMounted, editor, editable, content]);

  // ref를 통해 부모 컴포넌트에서 에디터 메서드에 접근할 수 있도록 노출
  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  }));

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageButtonClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        const url = await handleImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  }, [editor, handleImageUpload]);

  // 링크 추가/편집/제거 핸들러
  const handleAddLink = useCallback(() => {
    if (!editor) return;

    // 현재 선택된 텍스트가 링크인지 확인
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(
      previousUrl
        ? "링크 URL을 수정하세요 (삭제하려면 빈 값 입력):"
        : "링크 URL을 입력하세요:",
      previousUrl || "",
    );

    if (url === null) {
      // 사용자가 취소한 경우
      return;
    }

    if (url === "") {
      // 빈 값이면 링크 제거
      editor.chain().focus().unsetLink().run();
    } else if (url) {
      // URL이 있으면 링크 추가/수정
      // URL 형식 검증
      const urlPattern = /^(https?:\/\/|mailto:|\/)/i;
      const finalUrl = urlPattern.test(url) ? url : `https://${url}`;
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }
  }, [editor]);

  // 서버 사이드 렌더링 시 동일한 구조를 렌더링하여 Hydration 에러 방지
  if (!isMounted || !editor) {
    return (
      <div
        className={`${editable ? "border rounded-lg" : ""} overflow-hidden relative`}
      >
        {/* 툴바 (서버와 클라이언트에서 동일한 구조) */}
        {editable && (
          <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-px h-6 bg-border mx-1" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-px h-6 bg-border mx-1" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-px h-6 bg-border mx-1" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
            <div className="w-px h-6 bg-border mx-1" />
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
          </div>
        )}
        {/* 에디터 영역 */}
        <div
          className={`relative ${editable ? "p-4 min-h-[300px]" : ""} prose prose-sm max-w-none`}
        >
          <div className="text-muted-foreground">{placeholder}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${editable ? "border rounded-lg" : ""} overflow-hidden relative`}
    >
      {/* 툴바 */}
      {editable && (
        <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
          {/* 텍스트 스타일 */}
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("strike") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 제목 */}
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            H1
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            H3
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 리스트 */}
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 미디어 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageButtonClick}
            disabled={isUploading}
            title="이미지 삽입"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            variant={editor.isActive("link") ? "default" : "ghost"}
            size="sm"
            onClick={handleAddLink}
            title={editor.isActive("link") ? "링크 편집" : "링크 추가"}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 실행 취소/다시 실행 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 에디터 영역 */}
      <div
        className={`relative ${editable ? "p-4 min-h-[300px]" : ""} prose prose-sm max-w-none`}
      >
        <EditorContent editor={editor} />
        {isUploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-b-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>이미지 업로드 중...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
