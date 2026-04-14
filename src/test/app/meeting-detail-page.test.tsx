import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingDetailPage from "@/app/crews/[crewId]/meetings/[meetingId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import {
  cancelMeetingJoin,
  closeMeetingRecruitment,
  getMeetingDetail,
  joinMeeting,
  recordMeetingResult,
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

function makeMeetingDetail(
  overrides: Partial<Awaited<ReturnType<typeof getMeetingDetail>>> = {},
) {
  return {
    meetingId: 99,
    crewId: 11,
    hostUserId: 1,
    title: "금요일 저녁 야식",
    themeName: "야식",
    place: "강남역",
    date: "2026-04-20",
    time: "19:30",
    capacity: 4,
    totalCost: null,
    contactLink: null,
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

  it("renders the meeting detail with the current states and cost guidance", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        totalCost: 120000,
        contactLink: "https://open.kakao.com/o/example",
        description: "지각 없이 모여 주세요.",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "모임 상세" })).toBeInTheDocument();

    const detailSection = screen.getByRole("region", { name: "모임 상세 정보" });
    const participationSection = screen.getByRole("region", { name: "모임 참가 상태" });
    const operationSection = screen.getByRole("region", { name: "모임 운영" });

    expect(within(detailSection).getByRole("heading", { name: "금요일 저녁 야식" })).toBeInTheDocument();
    expect(within(detailSection).getByText("테마명: 야식")).toBeInTheDocument();
    expect(within(detailSection).getByText("총 비용 안내: 120000원")).toBeInTheDocument();
    expect(within(detailSection).getByText("1인당 예상 비용: 30000원")).toBeInTheDocument();
    expect(
      within(detailSection).getByText("연락 링크: https://open.kakao.com/o/example"),
    ).toBeInTheDocument();
    expect(within(participationSection).getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(within(participationSection).getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(within(operationSection).getByText("모집 상태: 모집 중")).toBeInTheDocument();
  });

  it("shows an edit entry only for the host when the meeting is editable", async () => {
    mockCurrentUser(1);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(makeMeetingDetail());

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const operationSection = await screen.findByRole("region", { name: "모임 운영" });

    expect(within(operationSection).getByRole("link", { name: "모임 수정" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99/edit",
    );
  });

  it("hides the edit entry for non-host users and completed meetings", async () => {
    mockCurrentUser(44);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(makeMeetingDetail());

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const firstOperationSection = await screen.findByRole("region", { name: "모임 운영" });
    expect(screen.getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(
      within(firstOperationSection).queryByRole("link", { name: "모임 수정" }),
    ).not.toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    mockCurrentUser(1);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const secondOperationSection = await screen.findByRole("region", { name: "모임 운영" });
    expect(within(secondOperationSection).getByText("모집 상태: 모임 종료")).toBeInTheDocument();
    expect(
      within(secondOperationSection).queryByRole("link", { name: "모임 수정" }),
    ).not.toBeInTheDocument();
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

    const participationSection = await screen.findByRole("region", { name: "모임 참가 상태" });
    fireEvent.click(within(participationSection).getByRole("button", { name: "참여하기" }));

    await waitFor(() => {
      expect(joinMeeting).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "모임 참가 상태" })).getByRole("button", {
        name: "참여취소",
      }),
    ).toBeInTheDocument();
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

    const participationSection = await screen.findByRole("region", { name: "모임 참가 상태" });
    fireEvent.click(within(participationSection).getByRole("button", { name: "참여취소" }));

    await waitFor(() => {
      expect(cancelMeetingJoin).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "모임 참가 상태" })).getByRole("button", {
        name: "참여하기",
      }),
    ).toBeInTheDocument();
  });

  it("shows operation actions for the host and updates the meeting status immediately", async () => {
    mockCurrentUser(1);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(makeMeetingDetail());
    vi.mocked(closeMeetingRecruitment).mockResolvedValue({
      meetingId: 99,
      status: "RECRUITMENT_CLOSED",
    });

    render(
      await CrewMeetingDetailPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    const operationSection = await screen.findByRole("region", { name: "모임 운영" });
    fireEvent.click(within(operationSection).getByRole("button", { name: "모집마감" }));

    await waitFor(() => {
      expect(closeMeetingRecruitment).toHaveBeenCalledWith(11, 99);
    });

    expect(
      within(screen.getByRole("region", { name: "모임 운영" })).getByText("모집 상태: 모집 마감"),
    ).toBeInTheDocument();
  });

  it("shows result input actions only for the host when the meeting is completed and not recorded", async () => {
    mockCurrentUser(1);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
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
    mockCurrentUser(1);
    mockCrewHub("LEADER");
    vi.mocked(getMeetingDetail).mockResolvedValue(
      makeMeetingDetail({
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

    const resultSection = await screen.findByRole("region", { name: "모임 결과" });
    fireEvent.click(within(resultSection).getByRole("button", { name: "성공" }));

    await waitFor(() => {
      expect(recordMeetingResult).toHaveBeenCalledWith(11, 99, "SUCCESS");
    });

    const updatedResultSection = await screen.findByRole("region", { name: "모임 결과" });
    expect(within(updatedResultSection).getByText("결과 상태: SUCCESS")).toBeInTheDocument();
    expect(within(updatedResultSection).queryByRole("button", { name: "성공" })).not.toBeInTheDocument();
    expect(within(updatedResultSection).queryByRole("button", { name: "실패" })).not.toBeInTheDocument();
  });

  it("redirects non-members to the public crew introduction", async () => {
    mockCurrentUser(44);
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
