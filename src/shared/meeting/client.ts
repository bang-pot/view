import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CreateMeetingInput,
  CreateMeetingResponse,
  MeetingDetail,
  MeetingListItem,
  RequestMeetingParticipationResponse,
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
      message: "모임 생성에 실패했습니다. 입력값을 다시 확인해 주세요.",
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

export async function requestMeetingParticipation(
  crewId: number,
  meetingId: number,
): Promise<RequestMeetingParticipationResponse> {
  return requestJson<RequestMeetingParticipationResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}/participation-requests`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      code: "MEETING_PARTICIPATION_REQUEST_FAILED",
      message: "참가 신청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}
