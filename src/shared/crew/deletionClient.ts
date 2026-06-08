import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type { CrewDeleteResponse, CrewDeletionAvailabilityResponse } from "@/shared/crew/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

const IDEMPOTENCY_OPTIONS = { idempotency: true } as const;

export async function getCrewDeletionAvailability(
  crewId: number,
): Promise<CrewDeletionAvailabilityResponse> {
  return requestJson<CrewDeletionAvailabilityResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/delete-check`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_DELETE_CHECK_FAILED",
      message: "크루 삭제 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function deleteCrew(
  crewId: number,
  crewName: string,
): Promise<CrewDeleteResponse> {
  return requestJson<CrewDeleteResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/delete`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        crewName,
      }),
    },
    {
      code: "CREW_DELETE_FAILED",
      message: "크루를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}
