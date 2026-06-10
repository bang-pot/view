import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileFavoritesPage from "@/app/profile/favorites/page";
import { getFavoriteThemes, getMe } from "@/shared/auth/client";
import type { FavoriteThemeListItem } from "@/shared/auth/types";
import { getExploreThemeDetail } from "@/shared/explore/client";
import type { ExploreThemeDetail } from "@/shared/explore/types";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/auth/client")>(
    "@/shared/auth/client",
  );

  return {
    ...actual,
    getMe: vi.fn(),
    getFavoriteThemes: vi.fn(),
  };
});

vi.mock("@/shared/explore/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/explore/client")>(
    "@/shared/explore/client",
  );

  return {
    ...actual,
    getExploreThemeDetail: vi.fn(),
  };
});

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "banglog" },
    requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
  });
}

function favoriteTheme(overrides: Partial<FavoriteThemeListItem> = {}): FavoriteThemeListItem {
  return {
    themeId: 701,
    themeName: "Banglog Favorite",
    storeName: "Escape Hub",
    regionName: "Seoul",
    thumbnailUrl: null,
    genreName: "공포",
    difficulty: 3,
    runningTimeMinutes: 90,
    description: "과거로 돌아가 사건의 진실을 파헤치고 현재로 돌아와 임무를 완수하라.",
    favoriteCount: 14,
    isFavorite: true,
    ...overrides,
  };
}

function themeDetail(overrides: Partial<ExploreThemeDetail> = {}): ExploreThemeDetail {
  return {
    themeId: 701,
    themeName: "Banglog Favorite",
    storeId: 31,
    storeName: "Escape Hub",
    regionLabel: "Seoul",
    genres: ["공포"],
    posterImageUrl: null,
    difficulty: 3,
    runningTimeMinutes: 90,
    description: "과거로 돌아가 사건의 진실을 파헤치고 현재로 돌아와 임무를 완수하라.",
    externalLink: "https://example.com/themes/701",
    isFavorite: true,
    relatedThemes: [],
    ...overrides,
  };
}

describe("ProfileFavoritesPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the favorite themes list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/favorites",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfileFavoritesPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprofile%2Ffavorites",
      );
    });
    expect(getFavoriteThemes).not.toHaveBeenCalled();
  });

  it("renders favorite themes as a profile list and links each item to the theme detail", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [
        favoriteTheme(),
        favoriteTheme({
          themeId: 702,
          themeName: "Mystery Station",
          storeName: "Puzzle Ground",
          regionName: "Busan",
          thumbnailUrl: "https://cdn.example.com/theme-702.jpg",
          genreName: "SF",
          difficulty: 4,
          runningTimeMinutes: 80,
          description: "첨단 기술로 가득한 미래도시에서 제한시간 안에 암호를 해독하라.",
          favoriteCount: 8,
        }),
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileFavoritesPage />);

    expect(await screen.findByRole("heading", { name: "찜한 테마" })).toBeInTheDocument();
    expect(screen.getByText("총 2개")).toBeInTheDocument();
    expect(screen.getByText("Banglog Favorite")).toBeInTheDocument();
    expect(screen.getByText("공포")).toBeInTheDocument();
    expect(screen.getByText(/90M/)).toBeInTheDocument();
    expect(screen.getByText(/Escape Hub/)).toBeInTheDocument();
    expect(screen.getByText(/과거로 돌아가 사건의 진실/)).toBeInTheDocument();
    expect(await screen.findByText("테마 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Banglog Favorite/ })).toHaveAttribute(
      "href",
      "/explore/themes/701",
    );
    expect(screen.getAllByText("→")).toHaveLength(2);
  });

  it("opens the explore-style theme detail dialog from a favorite theme item", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [favoriteTheme()],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getExploreThemeDetail).mockResolvedValue(themeDetail());

    render(<ProfileFavoritesPage />);

    fireEvent.click(await screen.findByRole("link", { name: /Banglog Favorite/ }));

    expect(getExploreThemeDetail).toHaveBeenCalledWith(701);
    const dialog = await screen.findByRole("dialog", { name: "Banglog Favorite" });
    expect(within(dialog).getByText("테마 소개")).toBeInTheDocument();
    expect(within(dialog).getByText(/과거로 돌아가 사건의 진실/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "찜 해제" })).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("찜 수")).not.toBeInTheDocument();
    expect(within(dialog).getByText("인원")).toBeInTheDocument();
    expect(within(dialog).queryByText("난이도")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈페이지 이동" })).toHaveAttribute(
      "href",
      "https://example.com/themes/701",
    );
  });

  it("loads favorite themes after a client navigation style remount", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [favoriteTheme()],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(
      <StrictMode>
        <ProfileFavoritesPage />
      </StrictMode>,
    );

    expect(await screen.findByRole("link", { name: /Banglog Favorite/ })).toHaveAttribute(
      "href",
      "/explore/themes/701",
    );
  });

  it("keeps the loaded list visible when load more fails", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes)
      .mockResolvedValueOnce({
        items: [
          favoriteTheme({
            genreName: null,
            difficulty: null,
            runningTimeMinutes: null,
            description: null,
          }),
        ],
        pageInfo: { page: 0, size: 20, hasNext: true },
      })
      .mockRejectedValueOnce(new Error("boom"));

    render(<ProfileFavoritesPage />);

    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    expect(
      await screen.findByText("찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("Banglog Favorite")).toBeInTheDocument();
  });

  it("shows an empty state when no favorite themes are returned", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileFavoritesPage />);

    expect(await screen.findByText("아직 찜한 테마가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "테마 둘러보기" })).toHaveAttribute("href", "/explore");
  });

  it("shows a retry affordance when the first load fails", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          favoriteTheme({
            genreName: null,
            difficulty: null,
            runningTimeMinutes: null,
            description: null,
          }),
        ],
        pageInfo: { page: 0, size: 20, hasNext: false },
      });

    render(<ProfileFavoritesPage />);

    expect(
      await screen.findByText("찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("Banglog Favorite")).toBeInTheDocument();
  });

  it("renders fallback metadata inside the list item", async () => {
    mockFullUser();
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [
        favoriteTheme({
          genreName: null,
          difficulty: null,
          runningTimeMinutes: null,
          description: null,
        }),
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileFavoritesPage />);

    const item = await screen.findByRole("listitem");
    expect(within(item).getByText("Banglog Favorite")).toBeInTheDocument();
    expect(within(item).getByText(/시간 정보 준비 중/)).toBeInTheDocument();
    expect(within(item).getByText("정보 준비 중")).toBeInTheDocument();
  });
});
