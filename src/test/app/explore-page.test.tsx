import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExplorePage from "@/app/explore/page";
import { OperationalError } from "@/shared/errors/operational";
import {
  addThemeFavorite,
  getExploreFilters,
  getExploreMeetingCreateCrews,
  getExploreThemes,
  removeThemeFavorite,
} from "@/shared/explore/client";
import type { ExploreThemeCard } from "@/shared/explore/types";

const replaceMock = vi.fn();
const pushMock = vi.fn();

const baseTheme: ExploreThemeCard = {
  themeId: 1,
  themeName: "미스터리 룸",
  storeId: 10,
  storeName: "강남 이스케이프",
  regionLabel: "서울 강남",
  genres: ["추리", "스릴러"],
  posterImageUrl: null,
  difficulty: 3,
  activityLabel: "활동성 중간",
  recommendedPlayers: "2-4명",
  runningTimeMinutes: 60,
  favoriteCount: 12,
  isFavorite: false,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

vi.mock("@/shared/explore/client", () => ({
  getExploreFilters: vi.fn(),
  getExploreMeetingCreateCrews: vi.fn(),
  getExploreThemes: vi.fn(),
  addThemeFavorite: vi.fn(),
  removeThemeFavorite: vi.fn(),
}));

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
    vi.mocked(getExploreFilters).mockReset();
    vi.mocked(getExploreMeetingCreateCrews).mockReset();
    vi.mocked(getExploreThemes).mockReset();
    vi.mocked(addThemeFavorite).mockReset();
    vi.mocked(removeThemeFavorite).mockReset();

    vi.mocked(getExploreFilters).mockResolvedValue({
      genres: ["공포", "추리", "드라마"],
      regions: [
        {
          name: "서울",
          districts: ["강남", "마포"],
        },
        {
          name: "경기",
          districts: ["수원"],
        },
      ],
    });
    vi.mocked(getExploreMeetingCreateCrews).mockResolvedValue({
      crews: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the escape explore wireframe with filters and theme cards", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [baseTheme],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 1234,
        totalPages: 155,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("heading", { name: "방탈출 탐색" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("테마명, 매장명 검색")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "탐색 필터" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "방탈출 (1,234)" })).toBeInTheDocument();

    const list = await screen.findByRole("list", { name: "방탈출 탐색 결과 목록" });
    const item = within(list).getByRole("listitem");

    expect(within(item).getByRole("link", { name: "미스터리 룸 상세 보기" })).toHaveAttribute(
      "href",
      "/explore/themes/1",
    );
    expect(within(item).getByRole("button", { name: "찜하기" })).toBeInTheDocument();
    expect(within(item).getByText("추리")).toBeInTheDocument();
    expect(within(item).getByText(/60분/)).toBeInTheDocument();
    expect(within(item).getByText(/강남 이스케이프/)).toBeInTheDocument();
    expect(within(item).queryByText(/서울 강남/)).not.toBeInTheDocument();
  });

  it("opens the theme detail modal from a theme card and closes it", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [
        baseTheme,
        {
          ...baseTheme,
          themeId: 2,
          themeName: "붉은 복도",
          genres: ["공포"],
          favoriteCount: 8,
        },
      ],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 2,
        totalPages: 1,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    fireEvent.click(await screen.findByRole("link", { name: "미스터리 룸 상세 보기" }));

    const dialog = await screen.findByRole("dialog", { name: "미스터리 룸" });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "찜하기" })).not.toHaveLength(0);
    expect(within(dialog).getByRole("button", { name: "홈페이지 이동" })).toBeInTheDocument();
    expect(within(dialog).getByText("테마 장르")).toBeInTheDocument();
    expect(within(dialog).getByText("2-4명")).toBeInTheDocument();
    expect(within(dialog).getByText("60분")).toBeInTheDocument();
    expect(within(dialog).getByText("테마 소개")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "같은 매장의 다른 테마" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "붉은 복도 상세 보기" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "이 테마로 모임 만들기" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "미스터리 룸" })).not.toBeInTheDocument();
    });
  });

  it("opens a crew picker modal from the theme detail CTA and routes to meeting creation", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [baseTheme],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 1,
        totalPages: 1,
      },
    });
    vi.mocked(getExploreMeetingCreateCrews).mockResolvedValue({
      crews: [
        { crewId: 11, crewName: "화요일 방팟" },
        { crewId: 12, crewName: "나이스 투 미츄" },
      ],
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    fireEvent.click(await screen.findByRole("link", { name: "미스터리 룸 상세 보기" }));
    fireEvent.click(await screen.findByRole("button", { name: "이 테마로 모임 만들기" }));

    const picker = await screen.findByRole("dialog", {
      name: "모임을 만들 크루를 선택해보세요!",
    });

    expect(getExploreMeetingCreateCrews).toHaveBeenCalledOnce();
    expect(within(picker).getByRole("button", { name: "화요일 방팟" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(picker).getByRole("button", { name: "나이스 투 미츄" }));
    fireEvent.click(within(picker).getByRole("button", { name: "이 크루에서 모임 만들기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/crews/12/meetings/new?themeName=%EB%AF%B8%EC%8A%A4%ED%84%B0%EB%A6%AC+%EB%A3%B8&storeName=%EA%B0%95%EB%82%A8+%EC%9D%B4%EC%8A%A4%EC%BC%80%EC%9D%B4%ED%94%84&regionLabel=%EC%84%9C%EC%9A%B8+%EA%B0%95%EB%82%A8&genre=%EC%B6%94%EB%A6%AC&difficulty=3&runningTimeMinutes=60",
      );
    });
  });

  it("updates the card favorite state immediately after a successful toggle response", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [baseTheme],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 1,
        totalPages: 1,
      },
    });
    vi.mocked(addThemeFavorite).mockResolvedValue({
      themeId: 1,
      isFavorite: true,
      favoriteCount: 13,
    });
    vi.mocked(removeThemeFavorite).mockResolvedValue({
      themeId: 1,
      isFavorite: false,
      favoriteCount: 12,
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    fireEvent.click(await screen.findByRole("button", { name: "찜하기" }));
    expect(await screen.findByRole("button", { name: "찜 해제" })).toHaveTextContent("13");

    fireEvent.click(screen.getByRole("button", { name: "찜 해제" }));
    expect(await screen.findByRole("button", { name: "찜하기" })).toHaveTextContent("12");
  });

  it("redirects guests to login when they try to favorite from the explore card", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [baseTheme],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 1,
        totalPages: 1,
      },
    });
    vi.mocked(addThemeFavorite).mockRejectedValue(
      new OperationalError({
        code: "AUTH_UNAUTHENTICATED",
        userMessage: "로그인이 필요해요.",
        status: 401,
      }),
    );

    render(await ExplorePage({ searchParams: Promise.resolve({ q: "강남" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "찜하기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/login?redirectTo=%2Fexplore%3Fq%3D%25EA%25B0%2595%25EB%2582%25A8",
      );
    });
  });

  it("loads the next page when the more button is clicked", async () => {
    vi.mocked(getExploreThemes)
      .mockResolvedValueOnce({
        items: [
          {
            ...baseTheme,
            themeId: 1,
            themeName: "첫번째 테마",
            favoriteCount: 10,
          },
        ],
        pageInfo: {
          page: 0,
          size: 8,
          hasNext: true,
          totalElements: 2,
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            ...baseTheme,
            themeId: 2,
            themeName: "두번째 테마",
            storeId: 11,
            storeName: "마포 이스케이프",
            regionLabel: "서울 마포",
            genres: ["공포"],
            favoriteCount: 5,
          },
        ],
        pageInfo: {
          page: 1,
          size: 8,
          hasNext: false,
          totalElements: 2,
          totalPages: 2,
        },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));
    await screen.findByRole("link", { name: "첫번째 테마 상세 보기" });

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));

    await screen.findByRole("link", { name: "두번째 테마 상세 보기" });

    expect(getExploreThemes).toHaveBeenNthCalledWith(2, {
      q: "",
      genres: [],
      region: "",
      district: "",
      page: 1,
      size: 8,
    });
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getExploreThemes).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 8,
        hasNext: false,
        totalElements: 0,
        totalPages: 0,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({ q: "없는 테마" }) }));

    expect(await screen.findByText("검색 조건에 맞는 방탈출이 없어요.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();

    vi.mocked(getExploreFilters).mockResolvedValue({
      genres: ["공포"],
      regions: [],
    });
    vi.mocked(getExploreThemes).mockRejectedValueOnce(new Error("network"));

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(
      await screen.findByText("방탈출 탐색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });
});
