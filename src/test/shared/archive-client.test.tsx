import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getArchiveMeetings } from "@/shared/archive/client";

const ORIGINAL_ENV = { ...process.env };

describe("archive client", () => {
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

  it("loads completed archive meetings with paging params", async () => {
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

    await getArchiveMeetings({ page: 0, size: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/archive/meetings?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
