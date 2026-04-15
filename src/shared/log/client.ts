import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import { isOperationalError } from "@/shared/errors/operational";
import type {
  CreateMeetingLogInput,
  CrewLogFeedQuery,
  CrewLogFeedResponse,
  DeleteMeetingLogResponse,
  MeetingLogDetail,
  MeetingLogSummary,
  SaveMeetingLogResponse,
  UploadLogPhotoResponse,
  UpdateMeetingLogInput,
} from "@/shared/log/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

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
  );
}

export async function uploadLogPhoto(file: File): Promise<UploadLogPhotoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<UploadLogPhotoResponse>(
    getApiBaseUrl(),
    "/api/uploads/log-photos",
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
    {
      code: "LOG_PHOTO_UPLOAD_FAILED",
      message: "사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

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
  );
}

export async function deleteMeetingLog(logId: number): Promise<DeleteMeetingLogResponse> {
  return requestJson<DeleteMeetingLogResponse>(
    getApiBaseUrl(),
    `/api/logs/${logId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
    {
      code: "LOG_DELETE_FAILED",
      message: "방탈로그를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getMyMeetingLog(meetingId: number): Promise<MeetingLogSummary | null> {
  try {
    return await requestJson<MeetingLogSummary>(
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
  } catch (error) {
    if (isOperationalError(error) && error.code === "LOG_NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

export async function getMeetingLogDetail(logId: number): Promise<MeetingLogDetail> {
  return requestJson<MeetingLogDetail>(
    getApiBaseUrl(),
    `/api/logs/${logId}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "LOG_DETAIL_REQUEST_FAILED",
      message: "방탈로그 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
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
