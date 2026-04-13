import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingDetailPage from "@/app/crews/[crewId]/meetings/[meetingId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import {
  cancelMeeting,
  cancelMeetingJoin,
  closeMeetingRecruitment,
  completeMeeting,
  getMeetingDetail,
  joinMeeting,
  recordMeetingResult,
  reopenMeetingRecruitment,
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
  closeMeetingRecruitment: vi.fn(),
  reopenMeetingRecruitment: vi.fn(),
  cancelMeeting: vi.fn(),
  completeMeeting: vi.fn(),
  recordMeetingResult: vi.fn(),
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

function makeMeetingDetail(overrides: Partial<Awaited<ReturnType<typeof getMeetingDetail>>> = {}) {
  return {
    meetingId: 99,
    crewId: 11,
    hostUserId: 1,
    themeName: "Board game meetup",
    place: "Gangnam",
    date: "2026-04-20",
    time: "19:30",
    capacity: 4,
    totalCost: null,
    reservationLink: null,
    openChatLink: null,
    description: null,
    status: "RECRUITING" as const,
    result: "NOT_RECORDED" as const,
    myParticipationStatus: "NOT_JOINED" as const,
    ...overrides,
  };
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
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        totalCost: 120000,
        reservationLink: "https://example.com/reserve",
        openChatLink: "https://open.kakao.com/o/example",
        description: "Please join on time.",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "모임 상세" })).toBeInTheDocument();
    expect(screen.getByText("모집 상태: RECRUITING")).toBeInTheDocument();
    expect(screen.getAllByText("결과 상태: NOT_RECORDED")).toHaveLength(2);
    expect(screen.getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "모임 목록으로 돌아가기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings",
    );
  });

  it("updates the participation status to joined after a successful instant join", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockResolvedValue(makeMeetingDetail());
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
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        myParticipationStatus: "JOINED",
      }),
    );
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
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(screen.getByText("참여 중")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "참여취소" })).not.toBeInTheDocument();
  });

  it("shows host operation actions for recruiting meetings and updates to recruitment closed", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
      }),
    );
    vi.mocked(closeMeetingRecruitment).mockResolvedValue({
      meetingId: 99,
      status: "RECRUITMENT_CLOSED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("button", { name: "모집마감" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "모임 취소" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수동 오픈" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모임 종료" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "모집마감" }));

    await waitFor(() => {
      expect(closeMeetingRecruitment).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("모집 상태: RECRUITMENT_CLOSED")).toBeInTheDocument();
  });

  it("shows reopen, complete, and cancel for the host after recruitment is closed", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "RECRUITMENT_CLOSED",
      }),
    );
    vi.mocked(reopenMeetingRecruitment).mockResolvedValue({
      meetingId: 99,
      status: "RECRUITING",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("button", { name: "수동 오픈" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "모임 종료" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "모임 취소" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "수동 오픈" }));

    await waitFor(() => {
      expect(reopenMeetingRecruitment).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("모집 상태: RECRUITING")).toBeInTheDocument();
  });

  it("lets the host complete a closed meeting", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "RECRUITMENT_CLOSED",
      }),
    );
    vi.mocked(completeMeeting).mockResolvedValue({
      meetingId: 99,
      status: "COMPLETED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "모임 종료" }));

    await waitFor(() => {
      expect(completeMeeting).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("모집 상태: COMPLETED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모임 종료" })).not.toBeInTheDocument();
  });

  it("lets a crew leader cancel a recruiting meeting but hides host-only actions", async () => {
    mockCurrentUser(44);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
      }),
    );
    vi.mocked(cancelMeeting).mockResolvedValue({
      meetingId: 99,
      status: "CANCELED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("button", { name: "모임 취소" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모집마감" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수동 오픈" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모임 종료" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "모임 취소" }));

    await waitFor(() => {
      expect(cancelMeeting).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("모집 상태: CANCELED")).toBeInTheDocument();
  });

  it("hides all operation buttons for a regular participant", async () => {
    mockCurrentUser(44);
    mockCrewHub("MEMBER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모집마감" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수동 오픈" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모임 취소" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모임 종료" })).not.toBeInTheDocument();
  });

  it("shows result input actions only for the host when the meeting is completed and not recorded", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "COMPLETED",
        result: "NOT_RECORDED",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const resultSection = await screen.findByRole("region", { name: "모임 결과" });

    expect(within(resultSection).getByText("결과 상태: NOT_RECORDED")).toBeInTheDocument();
    expect(within(resultSection).getByRole("button", { name: "성공" })).toBeInTheDocument();
    expect(within(resultSection).getByRole("button", { name: "실패" })).toBeInTheDocument();
  });

  it("updates the result immediately after the host records success", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "COMPLETED",
        result: "NOT_RECORDED",
      }),
    );
    vi.mocked(recordMeetingResult).mockResolvedValue({
      meetingId: 99,
      result: "SUCCESS",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "성공" }));

    await waitFor(() => {
      expect(recordMeetingResult).toHaveBeenCalledWith(11, 99, "SUCCESS");
    });

    const resultSection = await screen.findByRole("region", { name: "모임 결과" });

    expect(within(resultSection).getByText("결과 상태: SUCCESS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "성공" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "실패" })).not.toBeInTheDocument();
  });

  it("keeps the result section read-only for non-host users", async () => {
    mockCurrentUser(44);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "COMPLETED",
        result: "NOT_RECORDED",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const resultSection = await screen.findByRole("region", { name: "모임 결과" });

    expect(within(resultSection).getByText("결과 상태: NOT_RECORDED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "성공" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "실패" })).not.toBeInTheDocument();
  });

  it("keeps an already recorded result in read-only mode even for the host", async () => {
    mockCurrentUser(77);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        hostUserId: 77,
        myParticipationStatus: "JOINED",
        status: "COMPLETED",
        result: "FAILURE",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const resultSection = await screen.findByRole("region", { name: "모임 결과" });

    expect(within(resultSection).getByText("결과 상태: FAILURE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "성공" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "실패" })).not.toBeInTheDocument();
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
