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
    vi.useRealTimers();
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

  it("renders the escape schedule calendar and shows selected date items in time order", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-01T00:00:00"));

    const currentMonth = new Date();
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1,
    ).padStart(2, "0")}`;

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
          themeName: "미스터리 랜선",
          date: `${currentMonthKey}-14`,
          time: "10:00",
          meetingStatus: "RECRUITING",
          recruitmentStatus: "OPEN",
          place: "강남구 신사동",
          participantCount: 4,
          capacity: 6,
          isCanceled: false,
        },
        {
          meetingId: 202,
          themeName: "공포의 집",
          date: `${currentMonthKey}-14`,
          time: "14:30",
          meetingStatus: "COMPLETED",
          recruitmentStatus: "CLOSED",
          place: "마포구 연남동",
          participantCount: 6,
          capacity: 6,
          isCanceled: false,
        },
        {
          meetingId: 203,
          themeName: "시간의 미로",
          date: `${currentMonthKey}-14`,
          time: "14:00",
          meetingStatus: "CANCELED",
          recruitmentStatus: "CLOSED",
          place: "서초구 교대역",
          participantCount: 3,
          capacity: 4,
          isCanceled: true,
        },
      ],
    });

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "방탈 일정" })).toBeInTheDocument();
    await waitFor(() => {
      expect(getCrewSchedule).toHaveBeenCalledWith(11, {
        from: `${currentMonthKey}-01`,
        to: `${currentMonthKey}-31`,
      });
    });
    expect(await screen.findByText("2026년 5월")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "5월 14일 일정 3개" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const selectedPanel = screen.getByRole("complementary", { name: "선택 날짜 일정" });
    expect(within(selectedPanel).getByRole("heading", { name: "5월 14일" })).toBeInTheDocument();
    expect(within(selectedPanel).getByText("목요일")).toBeInTheDocument();
    expect(within(selectedPanel).getByText("일정 3개")).toBeInTheDocument();
    const items = within(selectedPanel).getAllByRole("link");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute("href", "/crews/11/meetings/201");
    expect(within(items[0]).getByText("10:00")).toBeInTheDocument();
    expect(within(items[0]).getByText("미스터리 랜선")).toBeInTheDocument();
    expect(within(items[0]).getByText("강남구 신사동")).toBeInTheDocument();
    expect(within(items[0]).getByText("4 / 6명")).toBeInTheDocument();
    expect(within(items[0]).getByText("모집")).toBeInTheDocument();
    expect(within(items[1]).getByText("14:00")).toBeInTheDocument();
    expect(within(items[1]).getByText("취소")).toBeInTheDocument();
    expect(within(items[2]).getByText("완료")).toBeInTheDocument();

    const canceledItem = within(selectedPanel).getByRole("link", { name: /시간의 미로/ });
    expect(within(canceledItem).getAllByText("취소").length).toBeGreaterThan(0);
    expect(canceledItem).toHaveAttribute("data-canceled", "true");
  });

  it("distinguishes between empty month and empty selected date states", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-04-01T00:00:00"));

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

    expect(await screen.findByText("이번 달에는 아직 등록된 방탈 일정이 없어요.")).toBeInTheDocument();

    unmount();
    cleanup();

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("button", { name: "4월 16일 일정 없음" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "4월 16일 일정 없음" }));
    expect(
      within(screen.getByRole("complementary", { name: "선택 날짜 일정" })).getAllByText(
        "선택한 날짜에는 방탈 일정이 없어요.",
      )[0],
    ).toBeInTheDocument();
  });

  it("keeps the page visible when schedule loading fails and allows retry", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-01T00:00:00"));

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
    expect(screen.getByRole("heading", { name: "방탈 일정" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getCrewSchedule).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Abyss")).toBeInTheDocument();
  });

  it("moves the visible month and reloads the crew schedule range", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-01T00:00:00"));

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
    vi.mocked(getCrewSchedule).mockResolvedValue({ items: [] });

    render(await CrewSchedulePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("2026년 5월")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(await screen.findByText("2026년 6월")).toBeInTheDocument();
    await waitFor(() => {
      expect(getCrewSchedule).toHaveBeenLastCalledWith(11, {
        from: "2026-06-01",
        to: "2026-06-30",
      });
    });
  });
});
