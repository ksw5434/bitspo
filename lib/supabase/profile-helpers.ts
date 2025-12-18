import { createClient } from "./client";
import { createClient as createServerClient } from "./server";

/**
 * 프로필 타입 정의
 */
export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 프로필 업데이트 데이터 타입
 */
export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
}

/**
 * 클라이언트에서 현재 사용자의 프로필 조회
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("프로필 조회 오류:", error);
    return null;
  }

  return data;
}

/**
 * 클라이언트에서 프로필 업데이트
 */
export async function updateProfile(
  updates: UpdateProfileData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: updates.name,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("프로필 업데이트 오류:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 서버에서 사용자 프로필 조회
 */
export async function getUserProfile(
  userId: string
): Promise<Profile | null> {
  const supabase = await createServerClient();
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
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("프로필 목록 조회 오류:", error);
    return [];
  }

  return data || [];
}

