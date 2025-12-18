"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { createClient } from "@/lib/supabase/client";

// 회원가입 페이지는 동적으로 렌더링 (prerender 방지)
export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // 폼 상태 관리
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 비밀번호 강도 검사 (최소 8자, 영문+숫자 조합)
  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  // 회원가입 처리 함수
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    // 입력값 검증
    if (!name.trim()) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage("이름은 최소 2자 이상이어야 합니다.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("이메일을 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return;
    }

    if (!validatePassword(password)) {
      setErrorMessage(
        "비밀번호는 최소 8자 이상이며 영문과 숫자를 포함해야 합니다."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    // Supabase 회원가입 처리
    setIsLoading(true);
    try {
      // Supabase에 회원가입 요청
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(), // 사용자 메타데이터에 이름 저장
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`, // 이메일 인증 후 리다이렉트 URL
        },
      });

      if (error) {
        // 에러 메시지 처리
        if (error.message.includes("already registered")) {
          setErrorMessage("이미 등록된 이메일입니다.");
        } else if (error.message.includes("Password")) {
          setErrorMessage(
            "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요."
          );
        } else {
          setErrorMessage(
            error.message || "회원가입에 실패했습니다. 다시 시도해주세요."
          );
        }
        return;
      }

      // 회원가입 성공
      if (data.user) {
        // 이메일 인증이 필요한 경우 안내 메시지 표시
        if (!data.session) {
          setErrorMessage(
            "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요."
          );
          // 3초 후 로그인 페이지로 이동
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        } else {
          // 세션이 있으면 바로 홈으로 이동
          router.push("/");
          router.refresh();
        }
      }
    } catch (error) {
      setErrorMessage("회원가입에 실패했습니다. 다시 시도해주세요.");
      console.error("회원가입 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오톡 로그인 처리
  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage("카카오톡 로그인에 실패했습니다.");
        console.error("카카오톡 로그인 오류:", error);
        setIsLoading(false);
      }
      // 성공 시 자동으로 리다이렉트되므로 여기서는 아무것도 하지 않음
    } catch (error) {
      setErrorMessage("카카오톡 로그인에 실패했습니다.");
      console.error("카카오톡 로그인 오류:", error);
      setIsLoading(false);
    }
  };

  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage("구글 로그인에 실패했습니다.");
        console.error("구글 로그인 오류:", error);
        setIsLoading(false);
      }
      // 성공 시 자동으로 리다이렉트되므로 여기서는 아무것도 하지 않음
    } catch (error) {
      setErrorMessage("구글 로그인에 실패했습니다.");
      console.error("구글 로그인 오류:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--navigation-height))] flex items-center justify-center bg-muted py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">회원가입</CardTitle>
          <CardDescription>비트스포에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3 mb-6">
            {/* 카카오톡 로그인 버튼 */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] border-[#FEE500] font-medium shadow-sm"
              onClick={handleKakaoLogin}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="#000000"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.94 5.08 4.78 6.45L5.5 21l4.05-2.25c.5.07 1.02.11 1.55.11 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
              </svg>
              카카오톡으로 시작하기
            </Button>

            {/* 구글 로그인 버튼 */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              구글로 시작하기
            </Button>
          </div>

          {/* 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 입력 필드 */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                이름
              </label>
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby={errorMessage ? "error-message" : undefined}
              />
            </div>

            {/* 이메일 입력 필드 */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby={errorMessage ? "error-message" : undefined}
              />
            </div>

            {/* 비밀번호 입력 필드 */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (최소 8자, 영문+숫자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby={errorMessage ? "error-message" : undefined}
              />
            </div>

            {/* 비밀번호 확인 입력 필드 */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby={errorMessage ? "error-message" : undefined}
              />
            </div>

            {/* 에러 메시지 표시 */}
            {errorMessage && (
              <div
                id="error-message"
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "처리 중..." : "회원가입"}
            </Button>

            {/* 로그인 링크 */}
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                로그인
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
