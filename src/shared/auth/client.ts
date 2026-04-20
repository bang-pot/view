import { requestJson, requestNoContent } from "@/shared/api/client";
import { sanitizeRedirectPath } from "@/shared/auth/guards";
import type {
  AuthCompletionResponse,
  AuthMeResponse,
  AuthProfileHubResponse,
  AuthProfileUpdateResponse,
  CancelPendingCrewResponse,
  CreatedMeetingsResponse,
  FavoriteThemesResponse,
  FavoriteThemesSummaryResponse,
  HomeResponse,
  JoinedMeetingsResponse,
  MyMeetingLogsResponse,
  MyCrewsResponse,
  NicknameAvailabilityResponse,
  PendingCrewsResponse,
  ProfileCalendarResponse,
  UserSearchResponse,
  WithdrawalRequest,
  WithdrawalCheckResponse,
  WithdrawalResponse,
} from "@/shared/auth/types";
import { getPublicRuntimeConfig } from "@/shared/config/public";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

export function buildKakaoLoginUrl(redirectTo: string | null | undefined): string {
  const safeRedirect = sanitizeRedirectPath(redirectTo);
  return `${getApiBaseUrl()}/oauth2/authorization/kakao?redirectTo=${encodeURIComponent(safeRedirect)}`;
}

export async function getMe(): Promise<AuthMeResponse> {
  return requestJson<AuthMeResponse>(
    getApiBaseUrl(),
    "/api/auth/me",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_ME_REQUEST_FAILED",
      message: "로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getProfile(): Promise<AuthProfileHubResponse> {
  return requestJson<AuthProfileHubResponse>(
    getApiBaseUrl(),
    "/api/users/me",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_PROFILE_REQUEST_FAILED",
      message: "프로필 허브를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function searchUsers(input: {
  keyword: string;
  size?: number;
}): Promise<UserSearchResponse> {
  const params = new URLSearchParams({
    keyword: input.keyword,
  });

  if (input.size !== undefined) {
    params.set("size", String(input.size));
  }

  return requestJson<UserSearchResponse>(
    getApiBaseUrl(),
    `/api/users/search?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_USER_SEARCH_REQUEST_FAILED",
      message: "회원 검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getHome(): Promise<HomeResponse> {
  return requestJson<HomeResponse>(
    getApiBaseUrl(),
    "/api/home",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_HOME_REQUEST_FAILED",
      message: "메인 홈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getMyCalendar(): Promise<ProfileCalendarResponse> {
  return requestJson<ProfileCalendarResponse>(
    getApiBaseUrl(),
    "/api/users/me/calendar",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_PROFILE_CALENDAR_REQUEST_FAILED",
      message: "달력 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCreatedMeetings(input: {
  page: number;
  size: number;
}): Promise<CreatedMeetingsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<CreatedMeetingsResponse>(
    getApiBaseUrl(),
    `/api/users/me/created-meetings?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_CREATED_MEETINGS_REQUEST_FAILED",
      message: "생성 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getJoinedMeetings(input: {
  page: number;
  size: number;
}): Promise<JoinedMeetingsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<JoinedMeetingsResponse>(
    getApiBaseUrl(),
    `/api/users/me/joined-meetings?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_JOINED_MEETINGS_REQUEST_FAILED",
      message: "참여 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getMyMeetingLogs(input: {
  page: number;
  size: number;
}): Promise<MyMeetingLogsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<MyMeetingLogsResponse>(
    getApiBaseUrl(),
    `/api/users/me/logs?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_MY_MEETING_LOGS_REQUEST_FAILED",
      message: "내 방탈로그 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getFavoriteThemesSummary(): Promise<FavoriteThemesSummaryResponse> {
  return requestJson<FavoriteThemesSummaryResponse>(
    getApiBaseUrl(),
    "/api/users/me/favorites/summary",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_FAVORITE_THEMES_SUMMARY_REQUEST_FAILED",
      message: "찜한 테마를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getFavoriteThemes(input: {
  page: number;
  size: number;
}): Promise<FavoriteThemesResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<FavoriteThemesResponse>(
    getApiBaseUrl(),
    `/api/users/me/favorites?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_FAVORITE_THEMES_REQUEST_FAILED",
      message: "찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getMyCrews(input: {
  page: number;
  size: number;
}): Promise<MyCrewsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<MyCrewsResponse>(
    getApiBaseUrl(),
    `/api/users/me/crews?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_MY_CREWS_REQUEST_FAILED",
      message: "소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getPendingCrews(input: {
  page: number;
  size: number;
}): Promise<PendingCrewsResponse> {
  const params = new URLSearchParams({
    page: String(input.page),
    size: String(input.size),
  });

  return requestJson<PendingCrewsResponse>(
    getApiBaseUrl(),
    `/api/users/me/pending-crews?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_PENDING_CREWS_REQUEST_FAILED",
      message: "가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function cancelPendingCrew(
  joinRequestId: number,
): Promise<CancelPendingCrewResponse> {
  return requestJson<CancelPendingCrewResponse>(
    getApiBaseUrl(),
    `/api/users/me/pending-crews/${joinRequestId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    {
      code: "AUTH_PENDING_CREW_CANCEL_FAILED",
      message: "가입 신청 취소에 실패했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getWithdrawalCheck(): Promise<WithdrawalCheckResponse> {
  return requestJson<WithdrawalCheckResponse>(
    getApiBaseUrl(),
    "/api/users/me/withdrawal-check",
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_WITHDRAWAL_CHECK_REQUEST_FAILED",
      message: "회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function withdrawUser(input: WithdrawalRequest): Promise<WithdrawalResponse> {
  return requestJson<WithdrawalResponse>(
    getApiBaseUrl(),
    "/api/users/me/withdrawal",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "AUTH_WITHDRAWAL_EXECUTION_FAILED",
      message: "회원탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<NicknameAvailabilityResponse> {
  const params = new URLSearchParams({ nickname });

  return requestJson<NicknameAvailabilityResponse>(
    getApiBaseUrl(),
    `/api/users/nickname-availability?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_NICKNAME_CHECK_FAILED",
      message: "닉네임 중복 확인에 실패했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function updateProfile(input: {
  nickname: string;
}): Promise<AuthProfileUpdateResponse> {
  return requestJson<AuthProfileUpdateResponse>(
    getApiBaseUrl(),
    "/api/users/me",
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "AUTH_PROFILE_UPDATE_FAILED",
      message: "프로필 저장에 실패했어요. 입력값을 다시 확인해 주세요.",
    },
  );
}

export async function completeProfile(input: {
  nickname: string;
  agreedToRequiredTerms: boolean;
}): Promise<AuthCompletionResponse> {
  return requestJson<AuthCompletionResponse>(
    getApiBaseUrl(),
    "/api/auth/complete",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "AUTH_COMPLETE_REQUEST_FAILED",
      message: "가입 완료 처리에 실패했어요. 입력값을 다시 확인해 주세요.",
    },
  );
}

export async function logout(): Promise<void> {
  return requestNoContent(
    getApiBaseUrl(),
    "/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "AUTH_LOGOUT_FAILED",
      message: "로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}
