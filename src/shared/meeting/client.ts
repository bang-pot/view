import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CancelMeetingJoinResponse,
  CreateMeetingInput,
  CreateMeetingResponse,
  JoinMeetingResponse,
  MeetingDetail,
  MeetingListItem,
} from "@/shared/meeting/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

export async function createMeeting(
  crewId: number,
  input: CreateMeetingInput,
): Promise<CreateMeetingResponse> {
  return requestJson<CreateMeetingResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "MEETING_CREATE_FAILED",
      message: "모임 생성을 완료하지 못했습니다. 입력값을 다시 확인해 주세요.",
    },
  );
}

export async function getMeetings(crewId: number): Promise<MeetingListItem[]> {
  return requestJson<MeetingListItem[]>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "MEETING_LIST_REQUEST_FAILED",
      message: "모임 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getMeetingDetail(
  crewId: number,
  meetingId: number,
): Promise<MeetingDetail> {
  return requestJson<MeetingDetail>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "MEETING_DETAIL_REQUEST_FAILED",
      message: "모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function joinMeeting(
  crewId: number,
  meetingId: number,
): Promise<JoinMeetingResponse> {
  return requestJson<JoinMeetingResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}/join`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      code: "MEETING_JOIN_FAILED",
      message: "즉시 참여를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function cancelMeetingJoin(
  crewId: number,
  meetingId: number,
): Promise<CancelMeetingJoinResponse> {
  return requestJson<CancelMeetingJoinResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}/join`,
    {
      method: "DELETE",
      credentials: "include",
    },
    {
      code: "MEETING_CANCEL_JOIN_FAILED",
      message: "참여취소를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}
