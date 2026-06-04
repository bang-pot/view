import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewLogFeedPage from "@/app/crews/[crewId]/logs/page";
import { getJoinedMeetings, getMe } from "@/shared/auth/client";
import { getCrewLogFeed } from "@/shared/log/client";
import { OperationalError } from "@/shared/errors/operational";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const routerMock = {
  replace: replaceMock,
  push: pushMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getJoinedMeetings: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getCrewLogFeed: vi.fn(),
}));

describe("CrewLogFeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders crew-scoped log feed cards for an active member", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [
        {
          logId: 501,
          meetingId: 99,
          authorNickname: "banglog",
          meetingTitle: "금요일 방탈출 번개",
          themeName: "미스터리 룸",
          meetingDate: "2026-04-10",
          createdAt: "2026-04-11T10:00:00Z",
          excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
          coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
          extraPhotoCount: 2,
          result: "SUCCESS",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그" })).toBeInTheDocument();
    expect(screen.queryByText("최신 작성순")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그 작성하기" })).toBeInTheDocument();
    expect(await screen.findByText("[미스터리 룸] 정답 모여쓰기 감각이 좋았던 기록이에요.")).toBeInTheDocument();
    expect(screen.getByText("banglog")).toBeInTheDocument();
    expect(screen.getByText("[금요일 방탈출 번개] · 성공 · 2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("+2장")).toBeInTheDocument();
    expect(screen.queryByText("대표 사진 준비 중")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /\[미스터리 룸\] 정답 모여쓰기 감각이 좋았던 기록이에요./,
      }),
    ).toHaveAttribute("href", "/crews/11/logs/501");
    expect(
      screen.getByRole("link", {
        name: /\[미스터리 룸\] 정답 모여쓰기 감각이 좋았던 기록이에요./,
      }),
    ).toHaveAttribute("data-result", "SUCCESS");
  });

  it("loads the feed when the tab page mounts inside React strict mode", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [
        {
          logId: 901,
          meetingId: 301,
          authorNickname: "runner",
          meetingTitle: "Strict 모드 번개",
          themeName: "시간의 미로",
          meetingDate: "2026-05-12",
          createdAt: "2026-05-13T10:00:00Z",
          excerpt: "탭 이동 후에도 실제 방탈로그가 보여야 해요.",
          coverPhotoUrl: null,
          extraPhotoCount: 0,
          result: "SUCCESS",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      <StrictMode>
        {await CrewLogFeedPage({
          params: Promise.resolve({ crewId: "11" }),
        })}
      </StrictMode>,
    );

    expect(await screen.findByText("[시간의 미로] 탭 이동 후에도 실제 방탈로그가 보여야 해요.")).toBeInTheDocument();
  });

  it("renders the crew workspace shell while the log feed is loading", async () => {
    vi.mocked(getMe).mockReturnValue(new Promise(() => undefined));

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(screen.getByRole("navigation", { name: "현재 위치" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방탈로그" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "방탈로그" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그 작성하기" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "방탈로그 준비 중" })).not.toBeInTheDocument();
    expect(screen.getByText("크루 방탈로그 피드를 불러오는 중입니다.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "방탈로그 미리보기" })).not.toBeInTheDocument();
    expect(screen.queryByText("기록 준비 중")).not.toBeInTheDocument();
  });

  it("redirects guests to login before loading the feed", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Flogs");
    });

    expect(getCrewLogFeed).not.toHaveBeenCalled();
  });

  it("loads the next page when the user clicks load more", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValueOnce({
      items: [
        {
          logId: 501,
          meetingId: 99,
          authorNickname: "banglog",
          meetingTitle: "금요일 방탈출 번개",
          themeName: "미스터리 룸",
          meetingDate: "2026-04-10",
          createdAt: "2026-04-11T10:00:00Z",
          excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
          result: "SUCCESS",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });
    vi.mocked(getCrewLogFeed).mockResolvedValueOnce({
      items: [
        {
          logId: 502,
          meetingId: 100,
          authorNickname: "runner",
          meetingTitle: "토요일 심야 번개",
          themeName: "어둠의 방",
          meetingDate: "2026-04-12",
          createdAt: "2026-04-12T10:00:00Z",
          excerpt: "사진보다 현장이 더 좋았던 기록이에요.",
          coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
          extraPhotoCount: 0,
          result: "FAILURE",
        },
      ],
      pageInfo: {
        page: 1,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByRole("heading", { name: "방탈로그" });
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(screen.getByText("[어둠의 방] 사진보다 현장이 더 좋았던 기록이에요.")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", {
        name: /사진보다 현장이 더 좋았던 기록이에요./,
      }),
    ).toHaveAttribute("data-result", "FAILURE");

    expect(getCrewLogFeed).toHaveBeenLastCalledWith(11, { page: 1, size: 20 });
  });

  it("opens a completed joined meeting picker before routing to the log editor", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(getJoinedMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 90,
          title: "다른 크루 모임",
          themeName: "다른 테마",
          crewId: 22,
          crewName: "다른 크루",
          date: "2026-04-20",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
        },
        {
          meetingId: 91,
          title: "아직 모집 중인 모임",
          themeName: "미래의 방",
          crewId: 11,
          crewName: "night runners",
          date: "2026-04-21",
          time: "19:00",
          status: "RECRUITING",
          canWriteReview: true,
        },
        {
          meetingId: 92,
          title: "이미 작성한 모임",
          themeName: "닫힌 방",
          crewId: 11,
          crewName: "night runners",
          date: "2026-04-22",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: false,
        },
        {
          meetingId: 101,
          title: "홍대 이스케이프 룸",
          themeName: "홍대 이스케이프 룸",
          crewId: 11,
          crewName: "night runners",
          date: "2026-05-12",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
          participantCount: 4,
        },
        {
          meetingId: 102,
          title: "건대 미스터리하우스",
          themeName: "건대 미스터리하우스",
          crewId: 11,
          crewName: "night runners",
          date: "2026-04-28",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
          participantCount: 4,
        },
        {
          meetingId: 103,
          title: "강남 탈출마스터",
          themeName: "강남 탈출마스터",
          crewId: 11,
          crewName: "night runners",
          date: "2026-03-15",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
          participantCount: 6,
        },
        {
          meetingId: 104,
          title: "신촌 퍼즐킹",
          themeName: "신촌 퍼즐킹",
          crewId: 11,
          crewName: "night runners",
          date: "2026-02-20",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
          participantCount: 4,
        },
        {
          meetingId: 105,
          title: "잠실 힌트제로",
          themeName: "잠실 힌트제로",
          crewId: 11,
          crewName: "night runners",
          date: "2026-01-10",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
          participantCount: 5,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByText("아직 등록된 방탈로그가 없어요.");
    fireEvent.click(screen.getByRole("button", { name: "로그 작성하기" }));

    const dialog = await screen.findByRole("dialog", { name: "참여한 모임 리스트" });
    expect(dialog).toBeInTheDocument();
    expect(getJoinedMeetings).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(screen.getByText("방탈 로그를 작성할 완료된 방탈 모집을 선택해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("홍대 이스케이프 룸")).toBeInTheDocument();
    expect(screen.getByText("건대 미스터리하우스")).toBeInTheDocument();
    expect(screen.queryByText("다른 크루 모임")).not.toBeInTheDocument();
    expect(screen.queryByText("아직 모집 중인 모임")).not.toBeInTheDocument();
    expect(screen.queryByText("이미 작성한 모임")).not.toBeInTheDocument();
    expect(screen.getAllByText("완료")).toHaveLength(4);
    expect(screen.getByLabelText("1페이지")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("2페이지")).not.toHaveAttribute("aria-current");

    fireEvent.click(screen.getByLabelText("건대 미스터리하우스 선택"));
    fireEvent.click(screen.getByRole("button", { name: "로그 작성하기" }));

    expect(pushMock).toHaveBeenCalledWith("/crews/11/meetings/102/log");
  });

  it("keeps the selected meeting while moving between picker pages", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(getJoinedMeetings).mockResolvedValue({
      items: Array.from({ length: 5 }, (_, index) => ({
        meetingId: 200 + index,
        title: `완료 모임 ${index + 1}`,
        themeName: `완료 모임 ${index + 1}`,
        crewId: 11,
        crewName: "night runners",
        date: `2026-05-${String(index + 1).padStart(2, "0")}`,
        time: "19:00",
        status: "COMPLETED" as const,
        canWriteReview: true,
      })),
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByText("아직 등록된 방탈로그가 없어요.");
    fireEvent.click(screen.getByRole("button", { name: "로그 작성하기" }));
    await screen.findByRole("dialog", { name: "참여한 모임 리스트" });
    fireEvent.click(screen.getByLabelText("완료 모임 2 선택"));

    const pagination = screen.getByRole("navigation", { name: "참여 모임 페이지 이동" });
    expect(within(pagination).getByRole("button", { name: "다음" })).toBeInTheDocument();
    const footer = screen.getByLabelText("방탈로그 작성 액션");
    expect(within(footer).queryByRole("button", { name: "다음" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "로그 작성하기" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(screen.getByText("완료 모임 5")).toBeInTheDocument();
    expect(screen.queryByText("완료 모임 2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그 작성하기" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "로그 작성하기" }));

    expect(pushMock).toHaveBeenCalledWith("/crews/11/meetings/201/log");
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByText("아직 등록된 방탈로그가 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "방탈로그 미리보기" })).toBeInTheDocument();
    expect(screen.getAllByText("기록 준비 중")).toHaveLength(6);

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockRejectedValueOnce(
      new OperationalError({
        code: "CREW_LOG_FEED_LOAD_FAILED",
        userMessage: "크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(
      await screen.findByText("크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        userMessage: "현재 크루원만 볼 수 있어요.",
        status: 403,
      }),
    );

    render(
      await CrewLogFeedPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
