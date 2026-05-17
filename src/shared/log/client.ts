import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import { uploadLogPhoto as uploadLogPhotoRequest } from "@/shared/image/client";
import type {
  CreateMeetingLogInput,
  CrewLogFeedQuery,
  CrewLogFeedResponse,
  DeleteMeetingLogResponse,
  MeetingLogDetail,
  MeetingLogMeResponse,
  SaveMeetingLogResponse,
  UpdateMeetingLogInput,
} from "@/shared/log/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

const IDEMPOTENCY_OPTIONS = { idempotency: true } as const;

export async function createMeetingLog(
  meetingId: number,
  input: CreateMeetingLogInput,
): Promise<SaveMeetingLogResponse> {
  return requestJson<SaveMeetingLogResponse>(
    getApiBaseUrl(),
    `/api/meetings/${meetingId}/logs`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "LOG_CREATE_FAILED",
      message: "방탈로그를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export const uploadLogPhoto = uploadLogPhotoRequest;

export async function updateMeetingLog(
  logId: number,
  input: UpdateMeetingLogInput,
): Promise<SaveMeetingLogResponse> {
  return requestJson<SaveMeetingLogResponse>(
    getApiBaseUrl(),
    `/api/logs/${logId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "LOG_UPDATE_FAILED",
      message: "방탈로그를 수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function deleteMeetingLog(
  crewId: number,
  logId: number,
  deleteReason?: string,
): Promise<DeleteMeetingLogResponse> {
  return requestJson<DeleteMeetingLogResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/logs/${logId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deleteReason: deleteReason ?? null,
      }),
    },
    {
      code: "LOG_DELETE_FAILED",
      message: "방탈로그를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getMyMeetingLog(meetingId: number): Promise<MeetingLogMeResponse> {
  return requestJson<MeetingLogMeResponse>(
    getApiBaseUrl(),
    `/api/meetings/${meetingId}/logs/me`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "LOG_ME_REQUEST_FAILED",
      message: "내 방탈로그를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCrewLogDetail(
  crewId: number,
  logId: number,
): Promise<MeetingLogDetail> {
  return requestJson<MeetingLogDetail>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/logs/${logId}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_LOG_DETAIL_REQUEST_FAILED",
      message: "크루 방탈로그 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCrewLogFeed(
  crewId: number,
  query: CrewLogFeedQuery,
): Promise<CrewLogFeedResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("size", String(query.size));

  return requestJson<CrewLogFeedResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/logs?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_LOG_FEED_LOAD_FAILED",
      message: "방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}
