import { NextResponse } from "next/server";
import { fetchEspnSportsScores } from "@/lib/espn-scores";

export const revalidate = 45;

/**
 * ESPN MLB · NBA · NFL 실시간 스코어 (서버 프록시 + 캐시)
 */
export async function GET() {
  try {
    const data = await fetchEspnSportsScores();

    if (data.items.length === 0) {
      return NextResponse.json(
        { error: "경기 정보를 불러오지 못했습니다.", ...data },
        { status: 503 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
      },
    });
  } catch (error) {
    console.error("sports/scores API 오류:", error);
    return NextResponse.json(
      { error: "스코어 데이터를 불러오지 못했습니다.", items: [] },
      { status: 500 },
    );
  }
}
