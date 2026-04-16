import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCrewGallery, getCrewGalleryDetail } from "@/shared/gallery/client";

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

  it("loads a crew gallery detail for a meeting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          meetingDate: "2026-04-12",
          meetingTitle: "금요일 방탈출",
          photos: [
            {
              photoId: 1001,
              url: "https://cdn.example.com/gallery/1.jpg",
              order: 1,
            },
          ],
          totalPhotoCount: 1,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewGalleryDetail(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/gallery/99",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
