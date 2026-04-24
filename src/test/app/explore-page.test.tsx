import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExplorePage from "@/app/explore/page";
import { OperationalError } from "@/shared/errors/operational";
import {
  addThemeFavorite,
  getExploreFilters,
  getExploreThemes,
  removeThemeFavorite,
} from "@/shared/explore/client";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const observerInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observerInstances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting = true) {
    this.callback(
      [
        {
          isIntersecting,
          target: document.createElement("div"),
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

vi.mock("@/shared/explore/client", () => ({
  getExploreFilters: vi.fn(),
  getExploreThemes: vi.fn(),
  addThemeFavorite: vi.fn(),
  removeThemeFavorite: vi.fn(),
}));

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
    observerInstances.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    vi.mocked(getExploreFilters).mockResolvedValue({
      genres: ["공포", "추리", "감성"],
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
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the public explore home with favorite buttons on cards", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [
        {
          themeId: 1,
          themeName: "미스터리 룸",
          storeId: 10,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genre: "추리",
          posterImageUrl: null,
          difficulty: 3,
          activityLabel: "활동성 중간",
          recommendedPlayers: "2-4명",
          runningTimeMinutes: 60,
          favoriteCount: 12,
          isFavorite: false,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("heading", { name: "방탈출 탐색" })).toBeInTheDocument();

    const list = await screen.findByRole("list", { name: "탐색 결과 목록" });
    const item = within(list).getByRole("listitem");

    expect(
      within(item).getByRole("link", { name: "미스터리 룸 상세 보기" }),
    ).toHaveAttribute("href", "/explore/themes/1");
    expect(within(item).getByRole("button", { name: "찜하기" })).toBeInTheDocument();
    expect(within(item).getByText("12")).toBeInTheDocument();
  });

  it("updates the card favorite state immediately after a successful toggle response", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [
        {
          themeId: 1,
          themeName: "미스터리 룸",
          storeId: 10,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genre: "추리",
          posterImageUrl: null,
          difficulty: 3,
          activityLabel: "활동성 중간",
          recommendedPlayers: "2-4명",
          runningTimeMinutes: 60,
          favoriteCount: 12,
          isFavorite: false,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
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
    expect(await screen.findByRole("button", { name: "찜 해제" })).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "찜 해제" }));
    expect(await screen.findByRole("button", { name: "찜하기" })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("redirects guests to login when they try to favorite from the explore card", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [
        {
          themeId: 1,
          themeName: "미스터리 룸",
          storeId: 10,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genre: "추리",
          posterImageUrl: null,
          difficulty: 3,
          activityLabel: "활동성 중간",
          recommendedPlayers: "2-4명",
          runningTimeMinutes: 60,
          favoriteCount: 12,
          isFavorite: false,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
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

  it("appends the next page when the sentinel enters the viewport", async () => {
    vi.mocked(getExploreThemes)
      .mockResolvedValueOnce({
        items: [
          {
            themeId: 1,
            themeName: "첫번째 테마",
            storeId: 10,
            storeName: "강남 이스케이프",
            regionLabel: "서울 강남",
            genre: "추리",
            posterImageUrl: null,
            difficulty: null,
            activityLabel: null,
            recommendedPlayers: null,
            runningTimeMinutes: null,
            favoriteCount: 10,
            isFavorite: false,
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
            themeId: 2,
            themeName: "두번째 테마",
            storeId: 11,
            storeName: "마포 이스케이프",
            regionLabel: "서울 마포",
            genre: "공포",
            posterImageUrl: null,
            difficulty: null,
            activityLabel: null,
            recommendedPlayers: null,
            runningTimeMinutes: null,
            favoriteCount: 5,
            isFavorite: false,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));
    await screen.findByText("첫번째 테마");

    observerInstances[0]?.trigger(true);

    await screen.findByText("두번째 테마");

    expect(getExploreThemes).toHaveBeenNthCalledWith(2, {
      q: "",
      genres: [],
      region: "",
      district: "",
      page: 1,
      size: 20,
    });
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getExploreThemes).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({ q: "없는 테마" }) }));

    expect(await screen.findByText("검색 조건을 바꿔서 다시 찾아보세요.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
    observerInstances.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    vi.mocked(getExploreFilters).mockResolvedValue({
      genres: ["공포"],
      regions: [],
    });
    vi.mocked(getExploreThemes).mockRejectedValueOnce(new Error("network"));

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(
      await screen.findByText("탐색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });
});
