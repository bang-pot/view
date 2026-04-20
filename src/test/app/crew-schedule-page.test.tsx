import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewSchedulePage from "@/app/crews/[crewId]/schedule/page";
import { getCrewHub, getCrewSchedule } from "@/shared/crew/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/crew/client", () => ({
  getCrewHub: vi.fn(),
  getCrewSchedule: vi.fn(),
}));

describe("CrewSchedulePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-schedule-1",
        status: 403,
      }),
    );

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });

  it("renders the crew schedule calendar and shows selected date items in time order", async () => {
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
    vi.mocked(getCrewSchedule).mockResolvedValue({
      items: [
        {
          meetingId: 201,
          themeName: "Abyss",
          date: "2026-04-15",
          time: "18:00",
          meetingStatus: "RECRUITING",
          recruitmentStatus: "OPEN",
          place: "Gangnam Branch",
          participantCount: 4,
          isCanceled: false,
        },
        {
          meetingId: 202,
          themeName: "Clock Tower",
          date: "2026-04-15",
          time: "20:00",
          meetingStatus: "COMPLETED",
          recruitmentStatus: "CLOSED",
          place: "Hongdae Branch",
          participantCount: 5,
          isCanceled: false,
        },
        {
          meetingId: 203,
          themeName: "Last Signal",
          date: "2026-04-18",
          time: "14:00",
          meetingStatus: "CANCELED",
          recruitmentStatus: "CLOSED",
          place: "Jamsil Branch",
          participantCount: 3,
          isCanceled: true,
        },
      ],
    });

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "일정" })).toBeInTheDocument();
    expect(screen.getByText("Night runners 크루의 방탈 일정을 확인할 수 있어요.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "15일" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "18일" })).toBeInTheDocument();

    const selectedPanel = screen.getByRole("complementary", { name: "선택 날짜 일정" });
    const items = within(selectedPanel).getAllByRole("link");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("href", "/crews/11/meetings/201");
    expect(items[1]).toHaveAttribute("href", "/crews/11/meetings/202");
    expect(within(items[0]).getByText("18:00")).toBeInTheDocument();
    expect(within(items[0]).getByText("Abyss")).toBeInTheDocument();
    expect(within(items[0]).getByText("Gangnam Branch")).toBeInTheDocument();
    expect(within(items[0]).getByText("참여 4명")).toBeInTheDocument();
    expect(within(items[0]).getByText("예정")).toBeInTheDocument();
    expect(within(items[1]).getByText("완료")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "18일" }));

    const canceledItem = within(screen.getByRole("complementary", { name: "선택 날짜 일정" })).getByRole(
      "link",
      { name: /Last Signal/ },
    );
    expect(within(canceledItem).getAllByText("취소").length).toBeGreaterThan(0);
    expect(canceledItem).toHaveAttribute("data-canceled", "true");
  });

  it("distinguishes between empty month and empty selected date states", async () => {
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
    vi.mocked(getCrewSchedule)
      .mockResolvedValueOnce({
        items: [],
      })
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 201,
            themeName: "Abyss",
            date: "2026-04-15",
            time: "18:00",
            meetingStatus: "RECRUITMENT_CLOSED",
            recruitmentStatus: "CLOSED",
            place: "Gangnam Branch",
            participantCount: 4,
            isCanceled: false,
          },
        ],
      });

    const { unmount } = render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("아직 등록된 일정이 없어요.")).toBeInTheDocument();

    unmount();
    cleanup();

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("button", { name: "16일" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "16일" }));
    expect(
      within(screen.getByRole("complementary", { name: "선택 날짜 일정" })).getAllByText(
        "이 날짜에는 일정이 없어요.",
      )[0],
    ).toBeInTheDocument();
  });

  it("keeps the page visible when schedule loading fails and allows retry", async () => {
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
    vi.mocked(getCrewSchedule)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 201,
            themeName: "Abyss",
            date: "2026-05-15",
            time: "18:00",
            meetingStatus: "RECRUITING",
            recruitmentStatus: "OPEN",
            place: "Gangnam Branch",
            participantCount: 4,
            isCanceled: false,
          },
        ],
      });

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("일정 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "일정" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getCrewSchedule).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Abyss")).toBeInTheDocument();
  });
});
