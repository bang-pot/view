import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExplorePage from "@/app/explore/page";
import { getExploreFilters, getExploreThemes } from "@/shared/explore/client";

const replaceMock = vi.fn();
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
  }),
}));

vi.mock("@/shared/explore/client", () => ({
  getExploreFilters: vi.fn(),
  getExploreThemes: vi.fn(),
}));

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
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

  it("renders the public explore home with the default first page", async () => {
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
          difficulty: "보통",
          activityLabel: "연출 중간",
          recommendedPlayers: "2-4명",
          runningTimeMinutes: 60,
          favoriteCount: 12,
          isFavorited: false,
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
    expect(screen.getByRole("searchbox", { name: "통합 검색" })).toBeInTheDocument();

    const list = await screen.findByRole("list", { name: "탐색 결과 목록" });
    const item = within(list).getByRole("listitem");

    expect(within(item).getByText("미스터리 룸")).toBeInTheDocument();
    expect(within(item).getByText("강남 이스케이프")).toBeInTheDocument();
    expect(within(item).getByText("서울 강남")).toBeInTheDocument();
    expect(within(item).getByText("추리")).toBeInTheDocument();
    expect(within(item).getByText("포스터 준비 중")).toBeInTheDocument();

    expect(getExploreThemes).toHaveBeenCalledWith({
      q: "",
      genres: [],
      region: "",
      district: "",
      page: 0,
      size: 20,
    });
  });

  it("applies the keyword only after an explicit submit", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));
    await screen.findByRole("heading", { name: "방탈출 탐색" });

    const input = screen.getByRole("searchbox", { name: "통합 검색" });
    fireEvent.change(input, { target: { value: "강남" } });

    expect(getExploreThemes).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(getExploreThemes).toHaveBeenCalledTimes(2);
    });

    expect(getExploreThemes).toHaveBeenLastCalledWith({
      q: "강남",
      genres: [],
      region: "",
      district: "",
      page: 0,
      size: 20,
    });
  });

  it("reloads results when filters change and resets district when region changes", async () => {
    vi.mocked(getExploreThemes).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));
    await screen.findByRole("heading", { name: "방탈출 탐색" });

    fireEvent.click(screen.getByRole("checkbox", { name: "장르 공포" }));

    await waitFor(() => {
      expect(getExploreThemes).toHaveBeenLastCalledWith({
        q: "",
        genres: ["공포"],
        region: "",
        district: "",
        page: 0,
        size: 20,
      });
    });

    fireEvent.change(screen.getByLabelText("시/도"), { target: { value: "서울" } });

    await waitFor(() => {
      expect(getExploreThemes).toHaveBeenLastCalledWith({
        q: "",
        genres: ["공포"],
        region: "서울",
        district: "",
        page: 0,
        size: 20,
      });
    });

    fireEvent.change(screen.getByLabelText("구/군"), { target: { value: "강남" } });

    await waitFor(() => {
      expect(getExploreThemes).toHaveBeenLastCalledWith({
        q: "",
        genres: ["공포"],
        region: "서울",
        district: "강남",
        page: 0,
        size: 20,
      });
    });

    fireEvent.change(screen.getByLabelText("시/도"), { target: { value: "경기" } });

    await waitFor(() => {
      expect(getExploreThemes).toHaveBeenLastCalledWith({
        q: "",
        genres: ["공포"],
        region: "경기",
        district: "",
        page: 0,
        size: 20,
      });
    });
  });

  it("appends the next page when the sentinel enters the viewport", async () => {
    vi.mocked(getExploreThemes)
      .mockResolvedValueOnce({
        items: [
          {
            themeId: 1,
            themeName: "첫 번째 테마",
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
            isFavorited: false,
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
            themeName: "두 번째 테마",
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
            isFavorited: false,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(await ExplorePage({ searchParams: Promise.resolve({}) }));
    await screen.findByText("첫 번째 테마");

    observerInstances[0]?.trigger(true);

    await screen.findByText("두 번째 테마");

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
