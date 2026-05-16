import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addThemeFavorite,
  getExploreFilters,
  getExploreMeetingCreateCrews,
  getExploreThemeDetail,
  getExploreThemes,
  removeThemeFavorite,
} from "@/shared/explore/client";

const ORIGINAL_ENV = { ...process.env };

describe("explore client", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_APP_ENV: "prod",
      NEXT_PUBLIC_API_BASE_URL: "/backend/",
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("loads explore filters with the public contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          genres: ["공포", "추리"],
          regions: [
            {
              name: "서울",
              districts: ["강남", "성수"],
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getExploreFilters();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/explore/filters",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads explore themes with keyword, multi-genre, location, and paging params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              themeId: 1,
              themeName: "강남 미스터리",
              storeId: 10,
              storeName: "강남 이스케이프",
              regionLabel: "서울 강남",
              genres: ["추리"],
              posterImageUrl: null,
              difficulty: 3,
              activityLabel: "활동성 중간",
              recommendedPlayers: "2-4명",
              runningTimeMinutes: 60,
              favoriteCount: 9,
              isFavorite: false,
            },
          ],
          pageInfo: {
            page: 0,
            size: 20,
            hasNext: false,
            totalElements: 1234,
            totalPages: 62,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await getExploreThemes({
      q: "강남 미스터리",
      genres: ["공포", "추리"],
      region: "서울",
      district: "강남",
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/explore/themes?q=%EA%B0%95%EB%82%A8+%EB%AF%B8%EC%8A%A4%ED%84%B0%EB%A6%AC&genres=%EA%B3%B5%ED%8F%AC&genres=%EC%B6%94%EB%A6%AC&region=%EC%84%9C%EC%9A%B8&district=%EA%B0%95%EB%82%A8&page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
    expect(response.pageInfo.totalElements).toBe(1234);
    expect(response.pageInfo.totalPages).toBe(62);
  });

  it("loads a public explore theme detail with favorite state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          themeId: 7,
          themeName: "사라진 서재",
          storeId: 3,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genres: ["추리"],
          posterImageUrl: null,
          difficulty: 3,
          runningTimeMinutes: 70,
          description: "소개글",
          externalLink: "https://example.com/theme/7",
          isFavorite: false,
          relatedThemes: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getExploreThemeDetail(7);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/explore/themes/7",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads the logged-in user's crews for meeting creation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crews: [
            {
              crewId: 11,
              crewName: "미드나잇 러너스",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getExploreMeetingCreateCrews();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/me/meeting-create",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("adds a theme favorite for the logged-in user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          themeId: 7,
          isFavorite: true,
          favoriteCount: 13,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await addThemeFavorite(7);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/themes/7/favorite",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
        }),
      }),
    );
  });

  it("removes a theme favorite for the logged-in user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          themeId: 7,
          isFavorite: false,
          favoriteCount: 12,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await removeThemeFavorite(7);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/themes/7/favorite",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
        }),
      }),
    );
  });
});
