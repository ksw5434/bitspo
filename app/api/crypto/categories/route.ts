import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCryptoCategory } from "@/lib/crypto-categories";

/** Crypto 카테고리 공개 조회 (/crypto 탭용) */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crypto_categories")
      .select("id, name, slug, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("crypto_categories")
        .select("id, name, created_at, updated_at")
        .order("name", { ascending: true });

      if (fallbackError) {
        return NextResponse.json({ data: [] });
      }

      return NextResponse.json({
        data: (fallbackData ?? []).map((row) => normalizeCryptoCategory(row)),
      });
    }

    return NextResponse.json({
      data: (data ?? []).map((row) => normalizeCryptoCategory(row)),
    });
  } catch (error) {
    console.error("Crypto 카테고리 조회 예외:", error);
    return NextResponse.json({ data: [] });
  }
}
