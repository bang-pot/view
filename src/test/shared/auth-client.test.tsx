import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkNicknameAvailability,
  completeProfile,
  getCreatedMeetings,
  getJoinedMeetings,
  getMyCrews,
  getMe,
  getProfile,
  logout,
  updateProfile,
} from "@/shared/auth/client";

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

  it("requests the current full user profile from the shared auth client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          nickname: "bangpot",
          profileImageUrl: null,
          createdMeetingsCount: 3,
          joinedMeetingsCount: 4,
          myCrewsCount: 2,
          pendingCrewsCount: 1,
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

    await getProfile();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("accepts nullable hub counts from the patch profile response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          nickname: "potmaster",
          profileImageUrl: null,
          createdMeetingsCount: null,
          joinedMeetingsCount: null,
          myCrewsCount: null,
          pendingCrewsCount: null,
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

    await expect(updateProfile({ nickname: "potmaster" })).resolves.toMatchObject({
      nickname: "potmaster",
      createdMeetingsCount: null,
      joinedMeetingsCount: null,
      myCrewsCount: null,
      pendingCrewsCount: null,
    });
  });

  it("requests the created meetings list from the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              meetingId: 31,
              title: "토요일 방탈출",
              status: "RECRUITING",
              date: "2026-04-20",
              time: "14:00",
              crewId: 7,
              crewName: "방팟 크루",
            },
          ],
          pageInfo: {
            page: 0,
            size: 20,
            hasNext: true,
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

    await getCreatedMeetings({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/created-meetings?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the joined meetings list from the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              meetingId: 41,
              title: "금요일 방탈출",
              themeName: "더 킹덤",
              crewId: 7,
              crewName: "방팟 크루",
              date: "2026-04-25",
              time: "19:00",
              status: "COMPLETED",
              result: "SUCCESS",
              canWriteReview: true,
            },
          ],
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

    await getJoinedMeetings({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/joined-meetings?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the active crews list from the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              crewId: 17,
              crewName: "방탈출 크루",
              visibility: "PUBLIC",
              leaderNickname: "bangpot",
              coverImageUrl: null,
            },
          ],
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

    await getMyCrews({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/crews?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("checks nickname availability through the users API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          available: true,
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

    await checkNicknameAvailability("bangpot");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/nickname-availability?nickname=bangpot",
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

  it("keeps validation fieldErrors when profile nickname updates fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "COMMON_VALIDATION_ERROR",
            message: "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.",
            requestId: "req-profile-1",
            fieldErrors: [
              {
                field: "nickname",
                message: "?됰꽕?꾩? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.",
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
      updateProfile({
        nickname: "",
      }),
    ).rejects.toMatchObject({
      code: "COMMON_VALIDATION_ERROR",
      message: "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.",
      requestId: "req-profile-1",
      status: 400,
      fieldErrors: [
        {
          field: "nickname",
          message: "?됰꽕?꾩? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.",
        },
      ],
      path: "/api/users/me",
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
      userMessage: "로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      requestId: "req-fallback-1",
      status: 503,
      fieldErrors: [],
      path: "/api/auth/me",
    });
  });

  it("posts logout without requiring a JSON response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(logout()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});
