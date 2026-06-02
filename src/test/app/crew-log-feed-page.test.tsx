import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewLogFeedPage from "@/app/crews/[crewId]/logs/page";
import { getMe } from "@/shared/auth/client";
import { getCrewLogFeed } from "@/shared/log/client";
import { OperationalError } from "@/shared/errors/operational";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
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
    expect(screen.getByRole("link", { name: "로그 작성하기" })).toHaveAttribute("href", "/crews/11/meetings");
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
    expect(screen.getByRole("link", { name: "로그 작성하기" })).toHaveAttribute("href", "/crews/11/meetings");
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
