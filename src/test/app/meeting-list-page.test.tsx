import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  getMeetings: vi.fn(),
}));

function mockCrewHub() {
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
}

describe("MeetingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the first paged crew meeting list response", async () => {
    mockCrewHub();
    vi.mocked(getMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 99,
          title: "에비스 : 영흥의 주민들",
          themeName: "이스케이프 FSC 강남점",
          place: "방탈오빠",
          date: "2026-06-10",
          time: "19:00",
          status: "RECRUITING",
          participantCount: 3,
          capacity: 6,
        },
      ],
      pageInfo: {
        page: 0,
        size: 4,
        hasNext: false,
      },
    });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "방탈 모집" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "모집 만들기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/new",
    );
    expect(screen.getByText("모집 상태")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "모집 중" })).toBeInTheDocument();
    expect(screen.getByText("모임 상태")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예정" })).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "방탈 모집 목록" });
    const item = within(list).getByRole("listitem");

    expect(getMeetings).toHaveBeenCalledWith(11, { page: 0, size: 4 });
    expect(within(item).getByRole("link", { name: "에비스 : 영흥의 주민들" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99",
    );
    expect(within(item).getByText("모집 중")).toBeInTheDocument();
    expect(within(item).getByText("예정")).toBeInTheDocument();
    expect(within(item).getByText("이스케이프 FSC 강남점")).toBeInTheDocument();
    expect(within(item).getByText("2026. 06. 10 (수) 19:00")).toBeInTheDocument();
    expect(within(item).getByText("3 / 6명")).toBeInTheDocument();
    expect(within(item).getByText("방탈오빠")).toBeInTheDocument();
  });

  it("loads the next meeting page and keeps the existing items", async () => {
    mockCrewHub();
    vi.mocked(getMeetings)
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 99,
            title: "Friday Escape",
            themeName: "Time Attack",
            place: "Gangnam",
            date: "2026-04-20",
            time: "19:30",
            status: "RECRUITING",
            participantCount: 2,
            capacity: 4,
          },
        ],
        pageInfo: {
          page: 0,
          size: 4,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 100,
            title: "Saturday Escape",
            themeName: "Deep Blue",
            place: "Hongdae",
            date: "2026-04-21",
            time: "20:00",
            status: "RECRUITMENT_CLOSED",
            participantCount: 6,
            capacity: 6,
          },
        ],
        pageInfo: {
          page: 1,
          size: 4,
          hasNext: false,
        },
      });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("link", { name: "Friday Escape" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "더보기" }));

    await waitFor(() => {
      expect(getMeetings).toHaveBeenLastCalledWith(11, { page: 1, size: 4 });
    });

    expect(screen.getByRole("link", { name: "Friday Escape" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Saturday Escape" })).toBeInTheDocument();
  });

  it("shows empty state and redirects non-members to the public crew introduction", async () => {
    mockCrewHub();
    vi.mocked(getMeetings).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 4,
        hasNext: false,
      },
    });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(getMeetings).toHaveBeenCalledWith(11, { page: 0, size: 4 });
    });
    expect(screen.getByText("아직 등록된 방탈 모집이 없어요.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "방탈 모집 목록" })).not.toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "Access denied.",
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
