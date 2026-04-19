import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { getHome } from "@/shared/auth/client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getHome: vi.fn(),
}));

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the guest home hub with preview sections and a login prompt", async () => {
    vi.mocked(getHome).mockResolvedValue({
      isLoggedIn: false,
      cta: {
        canCreateCrew: false,
        canExplorePublicCrews: true,
      },
      myCrews: {
        items: [],
        totalCount: 0,
      },
      upcomingMeetings: {
        items: [],
        totalCount: 0,
      },
      publicCrewPreview: {
        items: [
          {
            crewId: 11,
            crewName: "미스터리 크루",
            coverImageUrl: null,
            memberCount: 12,
            isPublic: true,
          },
        ],
      },
      themeExplorePreview: {
        items: [
          {
            themeId: 31,
            themeName: "인형의 집",
            storeName: "홍대 이스케이프",
            regionName: "서울 마포구",
            thumbnailUrl: null,
          },
        ],
      },
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("heading", { name: "BangPot" })).toBeInTheDocument();
    expect(
      screen.getByText("방탈출 크루를 찾고, 모임을 만들고, 다음 약속까지 한 번에 이어보세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공개 크루 탐색" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
    expect(screen.getByRole("link", { name: "크루 만들기" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Fcrews%2Fnew",
    );
    expect(
      screen.getByText("로그인하면 내 크루와 다가오는 모임을 더 편하게 볼 수 있어요."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "내 크루" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "다가오는 모임" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "공개 크루 탐색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "미스터리 크루 크루 보기" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByText("크루 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "방탈출 탐색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "인형의 집 테마 보기" })).toHaveAttribute(
      "href",
      "/explore/themes/31",
    );
    expect(screen.getByText("테마 이미지 준비 중")).toBeInTheDocument();
  });

  it("shows personalized summaries for logged-in users", async () => {
    vi.mocked(getHome).mockResolvedValue({
      isLoggedIn: true,
      cta: {
        canCreateCrew: true,
        canExplorePublicCrews: true,
      },
      myCrews: {
        items: [
          {
            crewId: 3,
            crewName: "방팟 크루",
          },
          {
            crewId: 7,
            crewName: "서울 탈출단",
          },
        ],
        totalCount: 2,
      },
      upcomingMeetings: {
        items: [
          {
            meetingId: 41,
            title: "금요일 방탈출",
            crewId: 3,
            crewName: "방팟 크루",
            date: "2026-04-25",
            time: "19:00",
            status: "RECRUITING",
          },
        ],
        totalCount: 1,
      },
      publicCrewPreview: {
        items: [],
      },
      themeExplorePreview: {
        items: [],
      },
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("heading", { name: "내 크루" })).toBeInTheDocument();
    expect(screen.getByText("현재 2개의 크루와 함께하고 있어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방팟 크루 크루로 이동" })).toHaveAttribute(
      "href",
      "/crews/3",
    );
    expect(screen.getByRole("link", { name: "소속 크루 전체 보기" })).toHaveAttribute(
      "href",
      "/profile/crews",
    );
    expect(screen.getByRole("heading", { name: "다가오는 모임" })).toBeInTheDocument();
    expect(screen.getByText("곧 참여할 일정 1개가 있어요.")).toBeInTheDocument();
    expect(screen.getByText("모집 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "금요일 방탈출 모임 보기" })).toHaveAttribute(
      "href",
      "/crews/3/meetings/41",
    );
    expect(screen.getByRole("link", { name: "크루 만들기" })).toHaveAttribute("href", "/crews/new");
    expect(screen.getByText("아직 공개 크루가 충분히 준비되지 않았어요.")).toBeInTheDocument();
    expect(screen.getByText("아직 탐색할 테마가 준비되지 않았어요.")).toBeInTheDocument();
  });

  it("shows a retry affordance when the home payload fails to load", async () => {
    vi.mocked(getHome)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        isLoggedIn: false,
        cta: {
          canCreateCrew: false,
          canExplorePublicCrews: true,
        },
        myCrews: {
          items: [],
          totalCount: 0,
        },
        upcomingMeetings: {
          items: [],
          totalCount: 0,
        },
        publicCrewPreview: {
          items: [],
        },
        themeExplorePreview: {
          items: [],
        },
      });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      await screen.findByText("메인 홈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getHome).toHaveBeenCalledTimes(2);
    });
  });

  it("shows notice messages after the redirect back home", async () => {
    vi.mocked(getHome).mockResolvedValue({
      isLoggedIn: true,
      cta: {
        canCreateCrew: true,
        canExplorePublicCrews: true,
      },
      myCrews: {
        items: [],
        totalCount: 0,
      },
      upcomingMeetings: {
        items: [],
        totalCount: 0,
      },
      publicCrewPreview: {
        items: [],
      },
      themeExplorePreview: {
        items: [],
      },
    });

    render(await Home({ searchParams: Promise.resolve({ notice: "crew-deleted" }) }));

    expect(await screen.findByText("크루를 삭제했습니다.")).toBeInTheDocument();
  });
});
