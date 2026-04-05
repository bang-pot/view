import { requestJson } from "@/shared/api/client";
import { sanitizeRedirectPath } from "@/shared/auth/guards";
import type {
  AuthCompletionResponse,
  AuthMeResponse,
  NicknameAvailabilityResponse,
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
      message: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<NicknameAvailabilityResponse> {
  const params = new URLSearchParams({ nickname });

  return requestJson<NicknameAvailabilityResponse>(
    getApiBaseUrl(),
    `/api/auth/nickname-availability?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "AUTH_NICKNAME_CHECK_FAILED",
      message: "닉네임 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
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
      message: "가입 완료 처리에 실패했습니다. 입력값을 다시 확인해 주세요.",
    },
  );
}
