import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  uploadCrewCoverImage,
  uploadLogPhoto,
  uploadProfileImage,
} from "@/shared/image/client";

const ORIGINAL_ENV = { ...process.env };

describe("image client", () => {
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

  it.each([
    ["log photo", uploadLogPhoto, "/backend/api/uploads/log-photos"],
    ["profile image", uploadProfileImage, "/backend/api/uploads/profile-images"],
    ["crew cover image", uploadCrewCoverImage, "/backend/api/uploads/crew-cover-images"],
  ] as const)("uploads a %s as multipart form-data", async (_label, upload, path) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          uploadId: 123,
          url: "https://cdn.example.com/temp/image.jpg",
          sizeBytes: 1024,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

    await upload(file);

    expect(fetchMock).toHaveBeenCalledWith(
      path,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.any(FormData),
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = requestInit.body as FormData;
    expect(body.get("file")).toBe(file);
    expect(requestInit.headers).toBeUndefined();
  });
});
