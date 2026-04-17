import { requestJson, requestNoContent } from "@/shared/api/client";
import { sanitizeRedirectPath } from "@/shared/auth/guards";
import type {
  AuthCompletionResponse,
  AuthMeResponse,
  AuthProfileHubResponse,
  AuthProfileUpdateResponse,
  CancelPendingCrewResponse,
  CreatedMeetingsResponse,
  JoinedMeetingsResponse,
  MyCrewsResponse,
  NicknameAvailabilityResponse,
  PendingCrewsResponse,
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
