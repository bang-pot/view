import type {
  AuthCompletionResponse,
  AuthMeResponse,
  NicknameAvailabilityResponse,
} from "@/shared/auth/types";
import { sanitizeRedirectPath } from "@/shared/auth/guards";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Auth request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function buildKakaoLoginUrl(redirectTo: string | null | undefined): string {
  const safeRedirect = sanitizeRedirectPath(redirectTo);
  return `${getApiBaseUrl()}/oauth2/authorization/kakao?redirectTo=${encodeURIComponent(safeRedirect)}`;
}

export async function getMe(): Promise<AuthMeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });

  return readJson<AuthMeResponse>(response);
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<NicknameAvailabilityResponse> {
  const params = new URLSearchParams({ nickname });
  const response = await fetch(
    `${getApiBaseUrl()}/api/auth/nickname-availability?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return readJson<NicknameAvailabilityResponse>(response);
}

export async function completeProfile(input: {
  nickname: string;
  agreedToRequiredTerms: boolean;
}): Promise<AuthCompletionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/complete`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<AuthCompletionResponse>(response);
}
