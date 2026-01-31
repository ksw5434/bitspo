import { createClient } from "./client";

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
 * 프로필 업데이트 데이터 타입
 */
export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  position?: string;
  bio?: string;
  affiliation?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  };
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

  // undefined 값을 제외하고 업데이트 객체 생성
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // 각 필드가 정의되어 있을 때만 추가
  if (updates.name !== undefined) {
    // 빈 문자열은 null로 변환
    updateData.name = updates.name.trim() || null;
  }
  if (updates.avatar_url !== undefined) {
    updateData.avatar_url = updates.avatar_url;
  }
  if (updates.position !== undefined) {
    updateData.position = updates.position;
  }
  if (updates.bio !== undefined) {
    updateData.bio = updates.bio;
  }
  if (updates.affiliation !== undefined) {
    updateData.affiliation = updates.affiliation;
  }
  if (updates.social_links !== undefined) {
    // 빈 객체인 경우 null로 변환, 그렇지 않으면 그대로 사용
    updateData.social_links = 
      updates.social_links && Object.keys(updates.social_links).length > 0
        ? updates.social_links
        : null;
  }

  console.log("프로필 업데이트 데이터:", updateData);
  console.log("사용자 ID:", user.id);

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select();

  if (error) {
    console.error("프로필 업데이트 오류:", error);
    console.error("오류 상세:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }

  // 업데이트된 행이 없는 경우 확인
  if (!data || data.length === 0) {
    console.warn("프로필 업데이트: 업데이트된 행이 없습니다.");
    return { success: false, error: "프로필을 찾을 수 없거나 업데이트할 수 없습니다." };
  }

  console.log("프로필 업데이트 성공:", data[0]);
  return { success: true };
}

