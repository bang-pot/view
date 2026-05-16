import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "@/shared/api/client";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds an Idempotency-Key header when idempotency is enabled", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestJson<{ ok: boolean }>(
      "/backend",
      "/api/example",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        code: "EXAMPLE_FAILED",
        message: "failed",
      },
      {
        idempotency: true,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/example",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      }),
    );
  });

  it("keeps normal requests without an Idempotency-Key header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestJson<{ ok: boolean }>(
      "/backend",
      "/api/example",
      {
        method: "GET",
        cache: "no-store",
      },
      {
        code: "EXAMPLE_FAILED",
        message: "failed",
      },
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toBeUndefined();
  });
});
