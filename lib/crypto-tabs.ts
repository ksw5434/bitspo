import type { CryptoCategoryRecord } from "@/lib/crypto-categories";

/** DB 카테고리 없을 때 기본 탭 */
export const FALLBACK_CRYPTO_CATEGORIES: Pick<
  CryptoCategoryRecord,
  "id" | "name" | "slug"
>[] = [
  { id: "fallback-bitcoin", name: "Bitcoin", slug: "bitcoin" },
  { id: "fallback-ethereum", name: "Ethereum", slug: "ethereum" },
  { id: "fallback-defi", name: "DeFi", slug: "defi" },
  { id: "fallback-nft", name: "NFT", slug: "nft" },
  { id: "fallback-altcoins", name: "Altcoins", slug: "altcoins" },
];

/** 활성 Crypto 카테고리 slug */
export function resolveActiveCryptoCategorySlug(
  categoryParam: string | null,
  categories: Pick<CryptoCategoryRecord, "slug">[],
): string {
  if (categoryParam?.trim()) {
    return categoryParam.trim();
  }

  return categories[0]?.slug ?? FALLBACK_CRYPTO_CATEGORIES[0].slug;
}
