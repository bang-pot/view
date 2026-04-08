import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CrewCreateInput,
  CrewCreateResponse,
  CrewJoinRequestInput,
  CrewJoinRequestResponse,
  CrewJoinViewResponse,
  PublicCrewSummary,
} from "@/shared/crew/types";

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

export async function getPublicCrews(): Promise<PublicCrewSummary[]> {
  return requestJson<PublicCrewSummary[]>(
    getApiBaseUrl(),
    "/api/crews/public",
    {
      cache: "no-store",
    },
    {
      code: "CREW_PUBLIC_LIST_REQUEST_FAILED",
      message: "공개 크루 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
    },
  );
}

export async function getPublicCrewJoinView(crewId: number): Promise<CrewJoinViewResponse> {
  return requestJson<CrewJoinViewResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_JOIN_VIEW_REQUEST_FAILED",
      message: "공개 크루 소개를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
    },
  );
}

export async function createCrewJoinRequest(
  crewId: number,
  input: CrewJoinRequestInput,
): Promise<CrewJoinRequestResponse> {
  return requestJson<CrewJoinRequestResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join-requests`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "CREW_JOIN_REQUEST_CREATE_FAILED",
      message: "가입 신청에 실패했습니다. 잠시 뒤 다시 시도해 주세요.",
    },
  );
}
