import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getExploreFilters, getExploreThemes } from "@/shared/explore/client";

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
              districts: ["강남", "홍대"],
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
          items: [],
          pageInfo: {
            page: 0,
            size: 20,
            hasNext: false,
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

    await getExploreThemes({
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
  });
});
