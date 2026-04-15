import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingHistoryPage from "@/app/crews/[crewId]/history/meetings/page";
import { getMe } from "@/shared/auth/client";
import { getCrewMeetingHistory } from "@/shared/meeting/client";
import { OperationalError } from "@/shared/errors/operational";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/meeting/client", () => ({
  getCrewMeetingHistory: vi.fn(),
}));

describe("CrewMeetingHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders completed meeting history cards with log CTAs", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMeetingHistory).mockResolvedValue({
      items: [
        {
          meetingId: 91,
          meetingTitle: "금요일 밤 방탈출 번개",
          themeName: "미스터리 룸",
          place: "강남 이스케이프",
          date: "2026-04-10",
          result: "SUCCESS",
          myLogStatus: "HAS_LOG",
          logId: 501,
        },
        {
          meetingId: 92,
          meetingTitle: "토요일 오후 번개",
          themeName: "고스트 호텔",
          place: "홍대 이스케이프",
          date: "2026-04-12",
          result: "FAILURE",
          myLogStatus: "NO_LOG",
          logId: null,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "완료된 모임 히스토리" })).toBeInTheDocument();
    expect(screen.getByText("미스터리 룸")).toBeInTheDocument();
    expect(screen.getByText("강남 이스케이프")).toBeInTheDocument();
    expect(screen.getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("내 기록 상태: 기록 있음")).toBeInTheDocument();
    expect(screen.getByText("내 기록 상태: 아직 기록 없음")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기록 보기" })).toHaveAttribute("href", "/logs/501");
    expect(screen.getByRole("link", { name: "기록 작성" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/92/log",
    );
  });

  it("redirects guests to login before loading history", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Fhistory%2Fmeetings");
    });

    expect(getCrewMeetingHistory).not.toHaveBeenCalled();
  });

  it("loads the next page when the user clicks load more", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMeetingHistory).mockResolvedValueOnce({
      items: [
        {
          meetingId: 91,
          meetingTitle: "금요일 밤 방탈출 번개",
          themeName: "미스터리 룸",
          place: "강남 이스케이프",
          date: "2026-04-10",
          result: "SUCCESS",
          myLogStatus: "HAS_LOG",
          logId: 501,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });
    vi.mocked(getCrewMeetingHistory).mockResolvedValueOnce({
      items: [
        {
          meetingId: 92,
          meetingTitle: "토요일 오후 번개",
          themeName: "고스트 호텔",
          place: "홍대 이스케이프",
          date: "2026-04-12",
          result: "FAILURE",
          myLogStatus: "NO_LOG",
          logId: null,
        },
      ],
      pageInfo: {
        page: 1,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByRole("heading", { name: "완료된 모임 히스토리" });
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(screen.getByText("고스트 호텔")).toBeInTheDocument();
    });

    expect(getCrewMeetingHistory).toHaveBeenLastCalledWith(11, { page: 1, size: 20 });
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMeetingHistory).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByText("아직 완료된 모임 히스토리가 없어요.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMeetingHistory).mockRejectedValueOnce(
      new OperationalError({
        code: "CREW_MEETING_HISTORY_LOAD_FAILED",
        userMessage: "완료된 모임 히스토리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(
      await screen.findByText("완료된 모임 히스토리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMeetingHistory).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        userMessage: "현재 크루원만 볼 수 있어요.",
        status: 403,
      }),
    );

    render(
      await CrewMeetingHistoryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
