import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeProfile, getMe } from "@/shared/auth/client";

const ORIGINAL_ENV = { ...process.env };

describe("auth client", () => {
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

  it("uses the configured API base URL without a development fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          authStatus: "GUEST",
          completionRequired: false,
          redirectTo: null,
          requiredTermsVersion: "2026-03-25",
          user: null,
          requiredTermsAcceptedAt: null,
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

    await getMe();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/auth/me",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("parses the backend common error contract into the shared error shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "AUTH_UNAUTHENTICATED",
            message: "인증이 필요합니다.",
            requestId: "req-auth-1",
            fieldErrors: [],
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(getMe()).rejects.toMatchObject({
      code: "AUTH_UNAUTHENTICATED",
      message: "인증이 필요합니다.",
      userMessage: "인증이 필요합니다.",
      status: 401,
      requestId: "req-auth-1",
      fieldErrors: [],
      path: "/api/auth/me",
    });
  });

  it("keeps validation fieldErrors from the backend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "COMMON_VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            requestId: "req-complete-1",
            fieldErrors: [
              {
                field: "nickname",
                message: "닉네임은 비어 있을 수 없습니다.",
              },
            ],
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(
      completeProfile({
        nickname: "",
        agreedToRequiredTerms: true,
      }),
    ).rejects.toMatchObject({
      code: "COMMON_VALIDATION_ERROR",
      message: "입력값이 올바르지 않습니다.",
      requestId: "req-complete-1",
      status: 400,
      fieldErrors: [
        {
          field: "nickname",
          message: "닉네임은 비어 있을 수 없습니다.",
        },
      ],
    });
  });

  it("uses fallback code and message only when the backend body is not the common contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "boom" }), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": "req-fallback-1",
          },
        }),
      ),
    );

    await expect(getMe()).rejects.toMatchObject({
      code: "AUTH_ME_REQUEST_FAILED",
      message: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      userMessage: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      requestId: "req-fallback-1",
      status: 503,
      fieldErrors: [],
      path: "/api/auth/me",
    });
  });
});
