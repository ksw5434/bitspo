import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Google AI API 키 확인
const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_AI_API_KEY 환경 변수가 설정되지 않았습니다.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * 게시글 요약 API
 * POST 요청으로 본문 내용을 받아서 요약을 생성합니다
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!genAI || !apiKey) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { content } = await request.json();
    console.log("content", content);

    // 본문 내용 검증
    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "본문 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // Gemini 모델 초기화
    // 모델 이름: gemini-1.5-flash-001 또는 gemini-1.5-flash-latest 사용
    // v1beta API에서는 정확한 모델 이름이 필요할 수 있음
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-001", // 버전을 명시적으로 지정
    });

    // 요약 프롬프트 생성
    const prompt = `다음 게시글을 3-5문장으로 요약해주세요:\n\n${content}`;

    // 요약 생성
    const result = await model.generateContent(prompt);

    // 응답 텍스트 추출 (안전한 방식)
    let summary = "";
    try {
      // 최신 API 버전에서는 response.text() 메서드 사용
      if (result.response && typeof result.response.text === "function") {
        summary = result.response.text().trim();
      }
      // 대체 방법: candidates 배열에서 직접 추출
      else if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        summary = result.response.candidates[0].content.parts[0].text.trim();
      }
      // 추가 대체 방법: response 객체에서 직접 접근
      else if (result.response?.text) {
        summary = String(result.response.text).trim();
      } else {
        throw new Error("응답에서 텍스트를 추출할 수 없습니다.");
      }
    } catch (textError) {
      console.error("텍스트 추출 오류:", textError);
      throw new Error("요약 응답을 처리하는 중 오류가 발생했습니다.");
    }

    // 요약이 비어있는 경우 에러 처리
    if (!summary || summary.trim() === "") {
      throw new Error("생성된 요약이 비어있습니다.");
    }

    return NextResponse.json({ summary });
  } catch (error) {
    // 상세한 에러 정보 로깅
    console.error("요약 생성 실패:", error);
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
      console.error("에러 스택:", error.stack);
    }

    // 에러 타입에 따른 처리
    if (error instanceof Error) {
      // 모델 관련 오류 (404 Not Found 등)
      if (
        error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("not supported") ||
        error.message.includes("models/")
      ) {
        return NextResponse.json(
          {
            error: "모델을 찾을 수 없습니다. 모델 이름을 확인해주세요.",
            details: error.message,
          },
          { status: 404 }
        );
      }
      // API 키 관련 오류
      if (
        error.message.includes("API_KEY") ||
        error.message.includes("API key") ||
        error.message.includes("authentication")
      ) {
        return NextResponse.json(
          { error: "API 키가 유효하지 않습니다." },
          { status: 401 }
        );
      }
      // 할당량 초과 오류
      if (
        error.message.includes("quota") ||
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return NextResponse.json(
          {
            error: "API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          },
          { status: 429 }
        );
      }
      // 응답 처리 오류
      if (
        error.message.includes("응답") ||
        error.message.includes("텍스트를 추출") ||
        error.message.includes("비어있습니다")
      ) {
        return NextResponse.json(
          {
            error: "요약 응답을 처리하는 중 오류가 발생했습니다.",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    // 일반적인 에러 응답
    return NextResponse.json(
      {
        error: "요약 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
