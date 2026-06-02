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
        size: 20,
        hasNext: false,
      },
    });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    const list = await screen.findByRole("list");
    const item = within(list).getByRole("listitem");

    expect(getMeetings).toHaveBeenCalledWith(11, { page: 0, size: 20 });
    expect(within(item).getByRole("link", { name: "Friday Escape" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99",
    );
    expect(within(item).getByText("모집 인원: 2 / 4명")).toBeInTheDocument();
    expect(within(item).getByText("테마명: Time Attack")).toBeInTheDocument();
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
          size: 20,
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
          size: 20,
          hasNext: false,
        },
      });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("link", { name: "Friday Escape" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(getMeetings).toHaveBeenLastCalledWith(11, { page: 1, size: 20 });
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
        size: 20,
        hasNext: false,
      },
    });

    render(await CrewMeetingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(getMeetings).toHaveBeenCalledWith(11, { page: 0, size: 20 });
    });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

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
