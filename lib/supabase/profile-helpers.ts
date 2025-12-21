// 클라이언트와 서버용 helper를 모두 re-export
// 호환성을 위해 유지되지만, 직접 import 시에는 각각의 파일을 사용하는 것을 권장합니다

// 타입은 클라이언트에서만 re-export (중복 방지)
export type { Profile, UpdateProfileData } from "./profile-helpers-client";

// 함수들은 모두 re-export
export {
  getCurrentUserProfile,
  updateProfile,
} from "./profile-helpers-client";

export {
  getUserProfile,
  getAllProfiles,
} from "./profile-helpers-server";
