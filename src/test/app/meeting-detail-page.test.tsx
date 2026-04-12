import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingDetailPage from "@/app/crews/[crewId]/meetings/[meetingId]/page";
import { getCrewHub } from "@/shared/crew/client";
import { getMeetingDetail } from "@/shared/meeting/client";

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

vi.mock("@/shared/meeting/client", () => ({
  createMeeting: vi.fn(),
  getMeetings: vi.fn(),
  getMeetingDetail: vi.fn(),
}));

describe("MeetingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the meeting detail with recruiting and not-recorded states", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "MEMBER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });
    vi.mocked(getMeetingDetail).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      themeName: "세븐클루스",
      place: "강남점",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: 120000,
      reservationLink: "https://example.com/reserve",
      openChatLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요.",
      status: "RECRUITING",
      result: "NOT_RECORDED",
    });

    render(await CrewMeetingDetailPage({ params: Promise.resolve({ crewId: "11", meetingId: "99" }) }));

    expect(await screen.findByRole("heading", { name: "모임 상세" })).toBeInTheDocument();
    expect(screen.getByText("모집 상태: RECRUITING")).toBeInTheDocument();
    expect(screen.getByText("결과 상태: NOT_RECORDED")).toBeInTheDocument();
    expect(screen.getByText("장소: 강남점")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "모임 목록으로 돌아가기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings",
    );
  });

  it("shows a safe failure state and redirects non-members to the public crew introduction", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "MEMBER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });
    vi.mocked(getMeetingDetail).mockRejectedValueOnce(new Error("boom"));

    render(await CrewMeetingDetailPage({ params: Promise.resolve({ crewId: "11", meetingId: "99" }) }));

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

    render(await CrewMeetingDetailPage({ params: Promise.resolve({ crewId: "11", meetingId: "99" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
