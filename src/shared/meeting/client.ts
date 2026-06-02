import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CancelMeetingJoinResponse,
  CreateMeetingInput,
  CreateMeetingResponse,
  JoinMeetingResponse,
  MeetingDetail,
  MeetingListQuery,
  MeetingListResponse,
  MeetingStatusUpdateResponse,
  UpdateMeetingInput,
  UpdateMeetingResponse,
} from "@/shared/meeting/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

const IDEMPOTENCY_OPTIONS = { idempotency: true } as const;

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
      message: "모임을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getMeetings(
  crewId: number,
  query: MeetingListQuery = { page: 0, size: 20 },
): Promise<MeetingListResponse> {
  const params = new URLSearchParams();

  params.set("page", String(query.page));
  params.set("size", String(query.size));

  return requestJson<MeetingListResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "MEETING_LIST_REQUEST_FAILED",
      message: "모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
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
      message: "모임 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function updateMeeting(
  crewId: number,
  meetingId: number,
  input: UpdateMeetingInput,
): Promise<UpdateMeetingResponse> {
  return requestJson<UpdateMeetingResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    {
      code: "MEETING_UPDATE_FAILED",
      message: "모임을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
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
      message: "모임 참여를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
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
      message: "모임 참여 취소를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

async function postMeetingStatusAction(
  crewId: number,
  meetingId: number,
  actionPath: string,
  failureCode: string,
  failureMessage: string,
): Promise<MeetingStatusUpdateResponse> {
  return requestJson<MeetingStatusUpdateResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}/${actionPath}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      code: failureCode,
      message: failureMessage,
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function closeMeetingRecruitment(
  crewId: number,
  meetingId: number,
): Promise<MeetingStatusUpdateResponse> {
  return postMeetingStatusAction(
    crewId,
    meetingId,
    "close-recruitment",
    "MEETING_CLOSE_RECRUITMENT_FAILED",
    "모임 모집 마감을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}

export async function reopenMeetingRecruitment(
  crewId: number,
  meetingId: number,
): Promise<MeetingStatusUpdateResponse> {
  return postMeetingStatusAction(
    crewId,
    meetingId,
    "reopen-recruitment",
    "MEETING_REOPEN_RECRUITMENT_FAILED",
    "모임 모집 재개를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}

export async function cancelMeeting(
  crewId: number,
  meetingId: number,
): Promise<MeetingStatusUpdateResponse> {
  return postMeetingStatusAction(
    crewId,
    meetingId,
    "cancel",
    "MEETING_CANCEL_FAILED",
    "모임 취소를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}

export async function completeMeeting(
  crewId: number,
  meetingId: number,
): Promise<MeetingStatusUpdateResponse> {
  return postMeetingStatusAction(
    crewId,
    meetingId,
    "complete",
    "MEETING_COMPLETE_FAILED",
    "모임 완료를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}
