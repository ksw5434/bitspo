import { createClient } from "./server";

/**
 * 프로필 타입 정의
 */
export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  position: string | null; // 직책
  bio: string | null; // 자기소개
  affiliation: string | null; // 소속
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * 서버에서 사용자 프로필 조회
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("프로필 조회 오류:", error);
    return null;
  }

  return data;
}

/**
 * 모든 공개 프로필 조회 (서버)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, position, bio, affiliation, social_links, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("프로필 목록 조회 오류:", error);
    return [];
  }

  return data || [];
}




