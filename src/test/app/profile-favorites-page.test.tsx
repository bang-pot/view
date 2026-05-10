import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileFavoritesPage from "@/app/profile/favorites/page";
import { getFavoriteThemes, getMe } from "@/shared/auth/client";
import { removeThemeFavorite } from "@/shared/explore/client";

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
    removeThemeFavorite: vi.fn(),
  };
});

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

  it("renders the favorite themes list and links each item to the theme detail", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [
        {
          themeId: 701,
          themeName: "Bangpot Favorite",
          storeName: "Escape Hub",
          regionName: "Seoul",
          thumbnailUrl: null,
          favoriteCount: 14,
          isFavorite: true,
        },
        {
          themeId: 702,
          themeName: "Mystery Station",
          storeName: "Puzzle Ground",
          regionName: "Busan",
          thumbnailUrl: "https://cdn.example.com/theme-702.jpg",
          favoriteCount: 8,
          isFavorite: true,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<ProfileFavoritesPage />);

    expect(await screen.findByRole("heading", { name: "찜한 테마" })).toBeInTheDocument();
    expect(screen.getByText("Bangpot Favorite")).toBeInTheDocument();
    expect(screen.getByText("Escape Hub")).toBeInTheDocument();
    expect(screen.getByText("Seoul")).toBeInTheDocument();
    expect(await screen.findByText("테마 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bangpot Favorite/ })).toHaveAttribute(
      "href",
      "/explore/themes/701",
    );
    expect(screen.getAllByRole("button", { name: "찜 해제" })).toHaveLength(2);
  });

  it("keeps the loaded list visible when load more fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getFavoriteThemes)
      .mockResolvedValueOnce({
        items: [
          {
            themeId: 701,
            themeName: "Bangpot Favorite",
            storeName: "Escape Hub",
            regionName: "Seoul",
            thumbnailUrl: null,
            favoriteCount: 14,
            isFavorite: true,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockRejectedValueOnce(new Error("boom"));

    render(<ProfileFavoritesPage />);

    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    expect(
      await screen.findByText("찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("Bangpot Favorite")).toBeInTheDocument();
  });

  it("removes an unfavorited item immediately and switches to the empty state after the last item", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [
        {
          themeId: 701,
          themeName: "Bangpot Favorite",
          storeName: "Escape Hub",
          regionName: "Seoul",
          thumbnailUrl: null,
          favoriteCount: 14,
          isFavorite: true,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(removeThemeFavorite).mockResolvedValueOnce({
      themeId: 701,
      isFavorite: false,
      favoriteCount: 13,
    });

    render(<ProfileFavoritesPage />);

    fireEvent.click(await screen.findByRole("button", { name: "찜 해제" }));

    expect(await screen.findByText("아직 찜한 테마가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "테마 둘러보기" })).toHaveAttribute("href", "/explore");
    expect(screen.queryByText("Bangpot Favorite")).not.toBeInTheDocument();
  });

  it("shows a retry affordance when the first load fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getFavoriteThemes)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            themeId: 701,
            themeName: "Bangpot Favorite",
            storeName: "Escape Hub",
            regionName: "Seoul",
            thumbnailUrl: null,
            favoriteCount: 14,
            isFavorite: true,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<ProfileFavoritesPage />);

    expect(
      await screen.findByText("찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("Bangpot Favorite")).toBeInTheDocument();
  });

  it("keeps the list visible when unfavorite fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getFavoriteThemes).mockResolvedValue({
      items: [
        {
          themeId: 701,
          themeName: "Bangpot Favorite",
          storeName: "Escape Hub",
          regionName: "Seoul",
          thumbnailUrl: null,
          favoriteCount: 14,
          isFavorite: true,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    vi.mocked(removeThemeFavorite).mockRejectedValueOnce(new Error("boom"));

    render(<ProfileFavoritesPage />);

    fireEvent.click(await screen.findByRole("button", { name: "찜 해제" }));

    const item = await screen.findByRole("listitem");
    expect(
      await within(item).findByText("찜 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(within(item).getByText("Bangpot Favorite")).toBeInTheDocument();
  });
});
