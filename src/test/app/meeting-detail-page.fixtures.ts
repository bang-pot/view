import { render } from "@testing-library/react";
import { vi } from "vitest";

import CrewMeetingDetailPage from "@/app/crews/[crewId]/meetings/[meetingId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import {
  cancelMeetingJoin,
  closeMeetingRecruitment,
  getMeetingDetail,
  joinMeeting,
} from "@/shared/meeting/client";
import { getMyMeetingLog } from "@/shared/log/client";

export const replaceMock = vi.fn();

const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/crew/client", () => ({
  getCrewHub: vi.fn(),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/meeting/client", () => ({
  getMeetingDetail: vi.fn(),
  joinMeeting: vi.fn(),
  cancelMeetingJoin: vi.fn(),
  closeMeetingRecruitment: vi.fn(),
  reopenMeetingRecruitment: vi.fn(),
  cancelMeeting: vi.fn(),
  completeMeeting: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getMyMeetingLog: vi.fn(),
}));

export const getCrewHubMock = vi.mocked(getCrewHub);
export const getMeetingDetailMock = vi.mocked(getMeetingDetail);
export const joinMeetingMock = vi.mocked(joinMeeting);
export const cancelMeetingJoinMock = vi.mocked(cancelMeetingJoin);
export const closeMeetingRecruitmentMock = vi.mocked(closeMeetingRecruitment);
export const getMyMeetingLogMock = vi.mocked(getMyMeetingLog);

export function mockCrew(role: "LEADER" | "MEMBER" = "MEMBER") {
  getCrewHubMock.mockResolvedValue({
    crewId: 11,
    name: "Night runners",
    description: "Private crew for late runners",
    visibility: "PRIVATE",
    imageUrl: null,
    myRole: role,
    hasNotice: false,
    pendingJoinRequestCount: 0,
  });
}

export function mockCurrentUser(id: number) {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-04-01",
    requiredTermsAcceptedAt: "2026-04-01T00:00:00Z",
    user: { id, nickname: "tester" },
  });
}

export function makeMeetingDetail(overrides: Partial<Awaited<ReturnType<typeof getMeetingDetail>>> = {}) {
  return {
    meetingId: 99,
    crewId: 11,
    hostUserId: 1,
    title: "금요일 늦은 번개",
    themeName: "미스터리 룸",
    place: "강남 이스케이프",
    date: "2026-04-20",
    time: "19:30",
    capacity: 4,
    participantCount: 1,
    totalCost: null,
    contactLink: null,
    description: null,
    status: "RECRUITING" as const,
    myParticipationStatus: "NOT_JOINED" as const,
    ...overrides,
  };
}

export function makeNotWrittenLog() {
  return {
    status: "NOT_WRITTEN" as const,
    logId: null,
    meetingId: 99,
    meetingTitle: null,
    themeName: null,
    place: null,
    date: null,
    authorNickname: null,
    createdAt: null,
    updatedAt: null,
    body: null,
    photos: [],
  };
}

export function makeDeletedBlockedLog() {
  return {
    ...makeNotWrittenLog(),
    status: "DELETED_BLOCKED" as const,
  };
}

export function makeExistingLog() {
  return {
    status: "EXISTS" as const,
    logId: 501,
    meetingId: 99,
    meetingTitle: "금요일 밤 방탈출 번개",
    themeName: "미스터리 룸",
    place: "강남 이스케이프",
    date: "2026-04-20",
    authorNickname: "tester",
    createdAt: "2026-04-21T10:00:00Z",
    updatedAt: "2026-04-21T11:00:00Z",
    body: "이미 저장한 로그예요.",
    photos: [],
  };
}

export function resetMeetingDetailMocks() {
  vi.clearAllMocks();
  replaceMock.mockReset();
  getMyMeetingLogMock.mockResolvedValue(makeNotWrittenLog());
}

export async function renderMeetingDetailPage() {
  return render(
    await CrewMeetingDetailPage({
      params: Promise.resolve({ crewId: "11", meetingId: "99" }),
    }),
  );
}
