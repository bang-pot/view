import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewLogFeedPage from "@/app/crews/[crewId]/logs/page";
import { getMe } from "@/shared/auth/client";
import { getCrewLogFeed } from "@/shared/log/client";
import { OperationalError } from "@/shared/errors/operational";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getCrewLogFeed: vi.fn(),
}));

describe("CrewLogFeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
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
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [
        {
          logId: 501,
          meetingId: 99,
          authorNickname: "bangpot",
          meetingTitle: "금요일 방탈출 번개",
          meetingDate: "2026-04-10",
          createdAt: "2026-04-11T10:00:00Z",
          excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
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

    expect(await screen.findByRole("heading", { name: "크루 방탈로그" })).toBeInTheDocument();
    expect(screen.getByText("정답 모여쓰기 감각이 좋았던 기록이에요.")).toBeInTheDocument();
    expect(screen.getByText("작성자 bangpot")).toBeInTheDocument();
    expect(screen.getByText("모임 금요일 방탈출 번개")).toBeInTheDocument();
    expect(screen.getByText("모임 날짜 2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("기록 시간 2026-04-11T10:00:00Z")).toBeInTheDocument();
    expect(screen.getByText("+ 2장")).toBeInTheDocument();
    expect(screen.getByText("대표 사진 준비 중")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /정답 모여쓰기 감각이 좋았던 기록이에요./,
      }),
    ).toHaveAttribute("href", "/crews/11/logs/501");
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
    expect(screen.getByText("크루 방탈로그 피드를 불러오는 중입니다.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "방탈로그 미리보기" })).toBeInTheDocument();
    expect(screen.getAllByText("기록 준비 중")).toHaveLength(6);
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
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogFeed).mockResolvedValueOnce({
      items: [
        {
          logId: 501,
          meetingId: 99,
          authorNickname: "bangpot",
          meetingTitle: "금요일 방탈출 번개",
          meetingDate: "2026-04-10",
          createdAt: "2026-04-11T10:00:00Z",
          excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
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
          meetingDate: "2026-04-12",
          createdAt: "2026-04-12T10:00:00Z",
          excerpt: "사진보다 현장이 더 좋았던 기록이에요.",
          coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
          extraPhotoCount: 0,
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

    await screen.findByRole("heading", { name: "크루 방탈로그" });
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(screen.getByText("사진보다 현장이 더 좋았던 기록이에요.")).toBeInTheDocument();
    });

    expect(getCrewLogFeed).toHaveBeenLastCalledWith(11, { page: 1, size: 20 });
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
      user: { id: 1, nickname: "bangpot" },
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
      user: { id: 1, nickname: "bangpot" },
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
