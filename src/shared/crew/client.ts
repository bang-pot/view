import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CrewHubResponse,
  CrewScheduleRange,
  CrewScheduleResponse,
  CrewMember,
  CrewPolicy,
  CrewJoinRequestApproveResponse,
  CrewCreateInput,
  CrewCreateResponse,
  CrewInviteCandidate,
  CrewInviteAcceptResponse,
  CrewInviteRejectResponse,
  CrewInviteResponse,
  CrewJoinRequestInput,
  CrewJoinRequestRecord,
  CrewJoinRequestRejectResponse,
  CrewJoinRequestResponse,
  CrewLeaveResponse,
  CrewDeleteResponse,
  CrewRemoveMemberResponse,
  CrewTransferLeadershipResponse,
  CrewJoinViewResponse,
  ExploreCrewsQuery,
  ExploreCrewsResponse,
  MyCrewInvitesQuery,
  MyCrewInvitesResponse,
  PendingCrewJoinRequestSummary,
  CrewVisibility,
  CrewVisibilityUpdateResponse,
} from "@/shared/crew/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

const IDEMPOTENCY_OPTIONS = { idempotency: true } as const;

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
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getExploreCrews(query: ExploreCrewsQuery): Promise<ExploreCrewsResponse> {
  const search = new URLSearchParams();

  search.set("page", String(query.page));
  search.set("size", String(query.size));

  const keyword = query.keyword?.trim();
  if (keyword) {
    search.set("keyword", keyword);
  }
  search.set("sort", query.sort ?? "LATEST");

  return requestJson<ExploreCrewsResponse>(
    getApiBaseUrl(),
    `/api/crews/explore?${search.toString()}`,
    {
      cache: "no-store",
    },
    {
      code: "CREW_EXPLORE_LIST_REQUEST_FAILED",
      message: "크루 탐색 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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

export async function getCrewHub(crewId: number): Promise<CrewHubResponse> {
  return requestJson<CrewHubResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_HUB_REQUEST_FAILED",
      message: "크루 내부 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function updateCrewVisibility(
  crewId: number,
  visibility: CrewVisibility,
): Promise<CrewVisibilityUpdateResponse> {
  return requestJson<CrewVisibilityUpdateResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/visibility`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visibility,
      }),
    },
    {
      code: "CREW_VISIBILITY_UPDATE_FAILED",
      message: "크루 공개 범위를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getCrewSchedule(
  crewId: number,
  range: CrewScheduleRange,
): Promise<CrewScheduleResponse> {
  const search = new URLSearchParams({
    from: range.from,
    to: range.to,
  });

  return requestJson<CrewScheduleResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/schedule?${search.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_SCHEDULE_REQUEST_FAILED",
      message: "일정 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function leaveCrew(crewId: number): Promise<CrewLeaveResponse> {
  return requestJson<CrewLeaveResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/leave`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_LEAVE_FAILED",
      message: "크루를 탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
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

export async function transferCrewLeadership(
  crewId: number,
  targetUserId: number,
): Promise<CrewTransferLeadershipResponse> {
  return requestJson<CrewTransferLeadershipResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/transfer-leadership`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserId,
      }),
    },
    {
      code: "CREW_TRANSFER_LEADERSHIP_FAILED",
      message: "크루장 위임에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function removeCrewMember(
  crewId: number,
  targetUserId: number,
): Promise<CrewRemoveMemberResponse> {
  return requestJson<CrewRemoveMemberResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/members/${targetUserId}/remove`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_MEMBER_REMOVE_FAILED",
      message: "크루원을 제외하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getCrewMembers(crewId: number): Promise<CrewMember[]> {
  return requestJson<CrewMember[]>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/members`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_MEMBERS_REQUEST_FAILED",
      message: "크루원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCrewPolicies(crewId: number): Promise<CrewPolicy[]> {
  return requestJson<CrewPolicy[]>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/policies`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_POLICIES_REQUEST_FAILED",
      message: "크루 정책을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getPendingCrewJoinRequests(
  crewId: number,
): Promise<PendingCrewJoinRequestSummary[]> {
  return requestJson<PendingCrewJoinRequestSummary[]>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join-requests/pending`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_JOIN_REQUEST_PENDING_SUMMARY_FAILED",
      message: "가입 신청 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCrewJoinRequests(
  crewId: number,
): Promise<CrewJoinRequestRecord[]> {
  return requestJson<CrewJoinRequestRecord[]>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join-requests`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_JOIN_REQUEST_LIST_FAILED",
      message: "가입 신청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function approveCrewJoinRequest(
  crewId: number,
  requestId: number,
): Promise<CrewJoinRequestApproveResponse> {
  return requestJson<CrewJoinRequestApproveResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join-requests/${requestId}/approve`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_JOIN_REQUEST_APPROVE_FAILED",
      message: "가입 신청 승인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function rejectCrewJoinRequest(
  crewId: number,
  requestId: number,
): Promise<CrewJoinRequestRejectResponse> {
  return requestJson<CrewJoinRequestRejectResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/join-requests/${requestId}/reject`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_JOIN_REQUEST_REJECT_FAILED",
      message: "가입 신청 거절에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getCrewInviteCandidates(
  crewId: number,
  nickname?: string,
): Promise<CrewInviteCandidate[]> {
  const search = new URLSearchParams();

  if (nickname && nickname.trim().length > 0) {
    search.set("nickname", nickname.trim());
  }

  const path = search.size > 0
    ? `/api/crews/${crewId}/invite-candidates?${search.toString()}`
    : `/api/crews/${crewId}/invite-candidates`;

  return requestJson<CrewInviteCandidate[]>(
    getApiBaseUrl(),
    path,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_INVITE_CANDIDATES_REQUEST_FAILED",
      message: "초대 가능한 회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function createCrewInvite(
  crewId: number,
  targetUserId: number,
): Promise<CrewInviteResponse> {
  return requestJson<CrewInviteResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/invites`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserId,
      }),
    },
    {
      code: "CREW_INVITE_CREATE_FAILED",
      message: "직접 초대 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function getMyCrewInvites(query: MyCrewInvitesQuery): Promise<MyCrewInvitesResponse> {
  const search = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });

  return requestJson<MyCrewInvitesResponse>(
    getApiBaseUrl(),
    `/api/crew-invites/me?${search.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_INVITE_LIST_FAILED",
      message: "내 초대 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function acceptCrewInvite(
  inviteId: number,
): Promise<CrewInviteAcceptResponse> {
  return requestJson<CrewInviteAcceptResponse>(
    getApiBaseUrl(),
    `/api/crew-invites/${inviteId}/accept`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_INVITE_ACCEPT_FAILED",
      message: "초대 수락에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}

export async function rejectCrewInvite(
  inviteId: number,
): Promise<CrewInviteRejectResponse> {
  return requestJson<CrewInviteRejectResponse>(
    getApiBaseUrl(),
    `/api/crew-invites/${inviteId}/reject`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "CREW_INVITE_REJECT_FAILED",
      message: "초대 거절에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    IDEMPOTENCY_OPTIONS,
  );
}
