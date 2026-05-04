import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { getHome } from "@/shared/auth/client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
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

  it("renders the guest landing home with previews, primary actions, and theme favorite buttons", async () => {
    vi.mocked(getHome).mockResolvedValue({
      isLoggedIn: false,
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
          },
        ],
      },
      themeExplorePreview: {
        items: [
          {
            themeId: 31,
            themeName: "사연의 집",
            storeName: "마포 이스케이프",
            regionName: "서울 마포구",
            thumbnailUrl: null,
            favoriteCount: 4,
            isFavorite: false,
          },
          {
            themeId: 32,
            themeName: "타임머신",
            storeName: "제로월드 홍대점",
            regionName: "서울 마포구",
            thumbnailUrl: null,
            favoriteCount: 1412,
            isFavorite: false,
          },
          {
            themeId: 33,
            themeName: "매트릭스",
            storeName: "코드케이 강남점",
            regionName: "서울 강남구",
            thumbnailUrl: null,
            favoriteCount: 1820,
            isFavorite: false,
          },
        ],
      },
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "BangPot" })).toHaveAttribute(
      "src",
      "/brand/bangpot-logo-horizontal.svg",
    );
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "크루 탐색" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
    expect(screen.getAllByRole("link", { name: "방탈출 탐색" })[0]).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(screen.queryByText("🔔")).not.toBeInTheDocument();
    expect(screen.getByLabelText("알림")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "우리의 탈출이 기록되는 LOG, BANGLOG",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "방로그 히어로 일러스트" })).toHaveAttribute(
      "src",
      "/home/main_illust.svg",
    );
    expect(screen.getAllByRole("link", { name: "카카오로 시작하기" })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "크루 둘러보기" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
    expect(screen.getByRole("heading", { name: "방로그와 함께라면" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "나와 딱 맞는 크루 찾기!" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "약속 잡기 쉽게!" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "방탈출 추억 남기기!" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "내 크루" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "다가오는 모임" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지금 모집 중인 크루" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "미스터리 크루 크루 보기" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByText("이미지 준비 중")).toBeInTheDocument();
    const crewMoreLink = screen.getByRole("link", { name: "크루 더 보기" });
    expect(crewMoreLink).toHaveAttribute("href", "/crews/public");
    expect(
      crewMoreLink.compareDocumentPosition(
        screen.getByRole("link", { name: "미스터리 크루 크루 보기" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "이번 주 인기 방탈출" })).toBeInTheDocument();
    expect(
      screen.getByText("좋아요 수 기준 · 본격 탐색은 방탈출 Explore에서"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Weekly · 최근 업데이트")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 인기 방탈출" })).toBeDisabled();
    const nextThemeButton = screen.getByRole("button", { name: "다음 인기 방탈출" });
    expect(nextThemeButton).toBeEnabled();
    expect(screen.getByRole("button", { name: "2위로 이동" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3위로 이동" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사연의 집 상세 보기" })).toHaveAttribute(
      "href",
      "/explore/themes/31",
    );
    expect(screen.getAllByRole("button", { name: "찜하기" })).toHaveLength(3);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("포스터 준비 중")).toHaveLength(3);
    expect(screen.getByText("◆ 마포 이스케이프")).toBeInTheDocument();
    expect(screen.queryByText(/BANGLOG ·/)).not.toBeInTheDocument();
    expect(screen.queryByText("자세히 보기")).not.toBeInTheDocument();
    fireEvent.click(nextThemeButton);
    expect(screen.getByRole("button", { name: "이전 인기 방탈출" })).toBeEnabled();
    expect(screen.getByLabelText("비로그인 시작 안내")).toHaveTextContent(
      "크루 탐색, 일정 등록, 기록까지",
    );
    expect(screen.getByRole("link", { name: "카카오로 시작" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows personalized summaries for logged-in users", async () => {
    vi.mocked(getHome).mockResolvedValue({
      isLoggedIn: true,
      myCrews: {
        items: [
          {
            crewId: 3,
            crewName: "방탈출 크루",
          },
          {
            crewId: 7,
            crewName: "서울 탈출러",
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
            crewName: "방탈출 크루",
            date: "2026-04-25",
            time: "19:00",
            status: "RECRUITING",
          },
        ],
        totalCount: 1,
      },
      publicCrewPreview: {
        items: [
          {
            crewId: 11,
            crewName: "미스터리 크루",
            coverImageUrl: null,
            memberCount: 12,
          },
        ],
      },
      themeExplorePreview: {
        items: [
          {
            themeId: 31,
            themeName: "사연의 집",
            storeName: "마포 이스케이프",
            regionName: "서울 마포구",
            thumbnailUrl: null,
            favoriteCount: 4,
            isFavorite: true,
          },
        ],
      },
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      await screen.findByRole("heading", { name: "오늘도 방탈출하러 가볼까요?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("안녕하세요, 탈출왕님 👋")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "활동 확인하기" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("heading", { name: "나의 활동" })).toBeInTheDocument();
    expect(screen.getAllByText("내 크루")).toHaveLength(2);
    expect(screen.getByText("2개")).toBeInTheDocument();
    expect(screen.getByText("예정된 활동")).toBeInTheDocument();
    expect(screen.getAllByText("1개")).toHaveLength(2);
    expect(screen.getByText("둘러볼 테마")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "내 크루" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방탈출 크루 크루로 이동" })).toHaveAttribute(
      "href",
      "/crews/3",
    );
    expect(screen.getByRole("link", { name: "서울 탈출러 크루로 이동" })).toHaveAttribute(
      "href",
      "/crews/7",
    );
    expect(screen.getByRole("link", { name: "금요일 방탈출 다음 활동 보기" })).toHaveAttribute(
      "href",
      "/crews/3/meetings/41",
    );
    expect(screen.getByRole("link", { name: "크루 찾기" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
    expect(screen.getByRole("heading", { name: "다른 크루도 둘러보세요" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "미스터리 크루 크루 보기" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByRole("heading", { name: "이번 주 인기 방탈출" })).toBeInTheDocument();
    expect(
      screen.getByText("좋아요 수 기준 · 본격 탐색은 방탈출 Explore에서"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "찜 해제" })).toBeInTheDocument();
    expect(screen.queryByLabelText("비로그인 시작 안내")).not.toBeInTheDocument();
  });

  it("shows a retry affordance when the home payload fails to load", async () => {
    vi.mocked(getHome)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        isLoggedIn: false,
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

    expect(await screen.findByText("크루를 해체했어요.")).toBeInTheDocument();
  });
});
