import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingDetailPage from "@/app/crews/[crewId]/meetings/[meetingId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import {
  cancelMeetingJoin,
  getMeetingDetail,
  joinMeeting,
} from "@/shared/meeting/client";

const replaceMock = vi.fn();
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
  createMeeting: vi.fn(),
  getMeetings: vi.fn(),
  getMeetingDetail: vi.fn(),
  joinMeeting: vi.fn(),
  cancelMeetingJoin: vi.fn(),
}));

function mockCrewHub(role: "LEADER" | "MEMBER" = "MEMBER") {
  vi.mocked(getCrewHub).mockResolvedValue({
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

function mockCurrentUser(id: number) {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-04-01",
    requiredTermsAcceptedAt: "2026-04-01T00:00:00Z",
    user: {
      id,
      nickname: "tester",
    },
  });
}

describe("MeetingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the meeting detail with recruiting, not-recorded, and not-joined participation states", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      themeName: "심야 테마 모임",
      place: "강남역",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: 120000,
      reservationLink: "https://example.com/reserve",
      openChatLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요.",
      status: "RECRUITING",
      result: "NOT_RECORDED",
      myParticipationStatus: "NOT_JOINED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "모임 상세" })).toBeInTheDocument();
    expect(screen.getByText("모집 상태: RECRUITING")).toBeInTheDocument();
    expect(screen.getByText("결과 상태: NOT_RECORDED")).toBeInTheDocument();
    expect(screen.getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.getByText("장소: 강남역")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "모임 목록으로 돌아가기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings",
    );
  });

  it("updates the participation status to joined after a successful instant join", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      themeName: "심야 테마 모임",
      place: "강남역",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: 120000,
      reservationLink: "https://example.com/reserve",
      openChatLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요.",
      status: "RECRUITING",
      result: "NOT_RECORDED",
      myParticipationStatus: "NOT_JOINED",
    });
    vi.mocked(joinMeeting).mockResolvedValue({
      meetingId: 99,
      myParticipationStatus: "JOINED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "참여하기" }));

    await waitFor(() => {
      expect(joinMeeting).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(screen.getByText("참여 중")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여취소" })).toBeInTheDocument();
  });

  it("updates the participation status to not-joined after a successful cancel", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      themeName: "심야 테마 모임",
      place: "강남역",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: null,
      reservationLink: null,
      openChatLink: null,
      description: null,
      status: "RECRUITING",
      result: "NOT_RECORDED",
      myParticipationStatus: "JOINED",
    });
    vi.mocked(cancelMeetingJoin).mockResolvedValue({
      meetingId: 99,
      myParticipationStatus: "NOT_JOINED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "참여취소" }));

    await waitFor(() => {
      expect(cancelMeetingJoin).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "참여취소" })).not.toBeInTheDocument();
  });

  it("hides the cancel action for the meeting host", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 77,
      themeName: "심야 테마 모임",
      place: "강남역",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: null,
      reservationLink: null,
      openChatLink: null,
      description: null,
      status: "RECRUITING",
      result: "NOT_RECORDED",
      myParticipationStatus: "JOINED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(screen.getByText("참여 중")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "참여취소" })).not.toBeInTheDocument();
  });

  it("shows a safe failure state and redirects non-members to the public crew introduction", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockRejectedValueOnce(new Error("boom"));

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(
      await screen.findByText("모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-meeting-detail-1",
        status: 403,
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
