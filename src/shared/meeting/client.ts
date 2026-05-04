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
  MeetingResult,
  MeetingResultRecordResponse,
  MeetingStatusUpdateResponse,
  UpdateMeetingInput,
  UpdateMeetingResponse,
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
      message: "紐⑥엫 ?앹꽦???꾨즺?섏? 紐삵뻽?듬땲?? ?낅젰媛믪쓣 ?ㅼ떆 ?뺤씤??二쇱꽭??",
    },
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
      message: "紐⑥엫 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
      message: "紐⑥엫 ?곸꽭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
      message: "紐⑥엫 ?뺣낫瑜??섏젙?섏? 紐삵뻽?듬땲?? ?낅젰媛믪쓣 ?ㅼ떆 ?뺤씤??二쇱꽭??",
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
      message: "利됱떆 李몄뿬瑜?泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
      message: "李몄뿬痍⑥냼瑜?泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
    },
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
    "紐⑥쭛留덇컧??泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
    "?섎룞 ?ㅽ뵂??泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
    "紐⑥엫 痍⑥냼瑜?泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
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
    "紐⑥엫 醫낅즺瑜?泥섎━?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
  );
}

export async function recordMeetingResult(
  crewId: number,
  meetingId: number,
  result: Exclude<MeetingResult, "NOT_RECORDED">,
): Promise<MeetingResultRecordResponse> {
  return requestJson<MeetingResultRecordResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/meetings/${meetingId}/result`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result,
      }),
    },
    {
      code: "MEETING_RESULT_RECORD_FAILED",
      message: "紐⑥엫 寃곌낵瑜?湲곕줉?섏? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
    },
  );
}
