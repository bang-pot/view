import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCrewGallery } from "@/shared/gallery/client";

const ORIGINAL_ENV = { ...process.env };

describe("gallery client", () => {
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

  it("loads a crew gallery page with paging params", async () => {
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
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewGallery(11, { page: 0, size: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/gallery?page=0&size=20",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
