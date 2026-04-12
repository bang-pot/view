import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingsPage from "@/app/crews/[crewId]/meetings/page";
import { getCrewHub } from "@/shared/crew/client";
import { getMeetings } from "@/shared/meeting/client";

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

describe("MeetingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the joined crew meeting list and links to create/detail pages", async () => {
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
    vi.mocked(getMeetings).mockResolvedValue([
      {
        meetingId: 99,
        themeName: "세븐클루스",
        place: "강남점",
        date: "2026-04-20",
        time: "19:30",
        status: "RECRUITING",
        result: "NOT_RECORDED",
        capacity: 4,
      },
    ]);

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "모임 목록" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "모임 만들기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/new",
    );

    const items = within(screen.getByRole("list", { name: "모임 목록" })).getAllByRole("listitem");
    expect(within(items[0]).getByRole("link", { name: "세븐클루스" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99",
    );
    expect(within(items[0]).getByText("모집 상태: RECRUITING")).toBeInTheDocument();
    expect(within(items[0]).getByText("결과 상태: NOT_RECORDED")).toBeInTheDocument();
  });

  it("shows empty state and redirects non-members to the public crew introduction", async () => {
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
    vi.mocked(getMeetings).mockResolvedValue([]);

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("아직 등록된 모임이 없습니다.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-meeting-list-1",
        status: 403,
      }),
    );

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
