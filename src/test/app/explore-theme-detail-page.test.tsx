import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExploreThemeDetailPage from "@/app/explore/themes/[themeId]/page";
import { getExploreThemeDetail } from "@/shared/explore/client";

vi.mock("@/shared/explore/client", () => ({
  getExploreThemeDetail: vi.fn(),
}));

describe("ExploreThemeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the theme detail and related themes", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "심야 추적",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description:
        "첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다. 네 번째 문장입니다. 다섯 번째 문장입니다.",
      externalLink: "https://example.com/theme/7",
      relatedThemes: [
        {
          themeId: 8,
          themeName: "암호실의 밤",
          storeId: 3,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
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
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByRole("heading", { name: "심야 추적" })).toBeInTheDocument();

    const detailSection = screen.getByRole("region", { name: "테마 상세 정보" });
    expect(within(detailSection).getByText("강남 이스케이프")).toBeInTheDocument();
    expect(within(detailSection).getByText("서울 강남")).toBeInTheDocument();
    expect(within(detailSection).getByText("장르 추리")).toBeInTheDocument();
    expect(within(detailSection).getByText("난이도 보통")).toBeInTheDocument();
    expect(within(detailSection).getByText("플레이 시간 70분")).toBeInTheDocument();
    expect(within(detailSection).getByText("포스터 준비 중")).toBeInTheDocument();
    expect(
      within(detailSection).getByRole("link", { name: "외부 예약 페이지 열기" }),
    ).toHaveAttribute("href", "https://example.com/theme/7");

    const relatedSection = screen.getByRole("region", { name: "같은 매장의 다른 테마" });
    expect(
      within(relatedSection).getByRole("link", { name: "암호실의 밤 상세 보기" }),
    ).toHaveAttribute("href", "/explore/themes/8");
  });

  it("toggles the description between collapsed and expanded states", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "심야 추적",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description:
        "청춘의 첫 장면입니다. 두 번째 장면입니다. 세 번째 장면입니다. 네 번째 장면입니다. 다섯 번째 장면입니다. 여섯 번째 장면입니다. 일곱 번째 장면입니다. 여덟 번째 장면입니다. 아홉 번째 장면입니다. 열 번째 장면입니다.",
      externalLink: null,
      relatedThemes: [],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByRole("button", { name: "더보기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "더보기" }));
    expect(screen.getByRole("button", { name: "접기" })).toBeInTheDocument();
  });

  it("shows fallback UI when optional fields are missing", async () => {
    vi.mocked(getExploreThemeDetail).mockRejectedValueOnce(new Error("network"));

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(
      await screen.findByText(
        "테마 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();

    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "심야 추적",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: null,
      posterImageUrl: null,
      difficulty: null,
      runningTimeMinutes: null,
      description: null,
      externalLink: null,
      relatedThemes: [],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByText("등록된 설명이 없습니다.")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "외부 예약 페이지 열기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("같은 매장의 다른 테마가 아직 없어요.")).toBeInTheDocument();
    expect(screen.getByText("장르 정보 준비 중")).toBeInTheDocument();
    expect(screen.getByText("난이도 정보 준비 중")).toBeInTheDocument();
    expect(screen.getByText("플레이 시간 정보 준비 중")).toBeInTheDocument();
  });
});
