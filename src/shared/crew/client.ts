import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type { CrewCreateInput, CrewCreateResponse } from "@/shared/crew/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

export async function createCrew(input: CrewCreateInput): Promise<CrewCreateResponse> {
  return requestJson<CrewCreateResponse>(
    getApiBaseUrl(),
    "/api/crews",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "CREW_CREATE_FAILED",
      message: "크루 생성에 실패했습니다. 입력값을 다시 확인해 주세요.",
    },
  );
}
