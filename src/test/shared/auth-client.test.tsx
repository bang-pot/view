import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelPendingCrew,
  checkNicknameAvailability,
  completeProfile,
  getFavoriteThemes,
  getFavoriteThemesSummary,
  getHome,
  getMyCalendar,
  getCreatedMeetings,
  getJoinedMeetings,
  getMyMeetingLogs,
  getMyCrews,
  getPendingCrews,
  getWithdrawalCheck,
  getMe,
  getProfile,
  searchUsers,
  logout,
  updateProfile,
  withdrawUser,
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

  it("requests the home hub payload from the shared auth client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          isLoggedIn: false,
          myCrews: {
            items: [],
            totalCount: 0,
          },
          upcomingMeetings: {
            nearestMeeting: null,
            totalCount: 0,
          },
          activityRecord: {
            completedCount: 0,
            successRate: 0,
          },
          publicCrewPreview: {
            items: [
              {
                crewId: 10,
                crewName: "怨듦컻 ?щ（",
                coverImageUrl: null,
                memberCount: 12,
              },
            ],
          },
          themeExplorePreview: {
            items: [
              {
                themeId: 101,
                themeName: "미스터리 룸",
                storeName: "방탈출 스토어",
                regionName: "?쒖슱",
                thumbnailUrl: null,
                favoriteCount: 6,
                isFavorite: false,
              },
            ],
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

    await getHome();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/home",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the profile calendar payload from the shared auth client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              meetingId: 91,
              meetingTitle: "수요일 방탈출",
              crewId: 7,
              crewName: "諛⑺뙚 ?щ（",
              date: "2026-05-02",
              time: "14:00",
              meetingStatus: "RECRUITING",
              isCanceled: false,
              participationRole: "HOST",
            },
          ],
          totalCount: 1,
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

    await getMyCalendar();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/calendar",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the user search results from the shared auth client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              userId: 101,
              nickname: "bangpot",
              profileImageUrl: null,
              bio: "escape lover",
              gender: "FEMALE",
              escapeCount: 0,
            },
          ],
          pageInfo: {
            page: 1,
            size: 12,
            totalElements: 33,
            totalPages: 3,
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

    await searchUsers({
      keyword: "bang",
      page: 1,
      size: 12,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/search?keyword=bang&page=1&size=12",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the paged favorite themes list from the profile favorites API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              themeId: 601,
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

    await getFavoriteThemes({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/favorites?page=0&size=20",
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
              title: "수요일 방탈출",
              status: "RECRUITING",
              date: "2026-04-20",
              time: "14:00",
              crewId: 7,
              crewName: "諛⑺뙚 ?щ（",
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
              themeName: "???밸뜡",
              crewId: 7,
              crewName: "諛⑺뙚 ?щ（",
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

  it("requests the authored meeting logs list from the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              logId: 501,
              crewId: 31,
              crewName: "Alpha Crew",
              meetingId: 201,
              meetingTitle: "Friday Escape",
              meetingDate: "2026-04-18",
              createdAt: "2026-04-19T10:15:30Z",
              excerpt: "?닿? 吏곸젒 ??諛⑺깉濡쒓렇 ?붿빟",
              coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
              photoCount: 3,
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

    await getMyMeetingLogs({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/logs?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the favorite themes summary from the profile summary API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              themeId: 301,
              themeName: "서비스 룸",
              storeName: "?쒖슱 ?댁뒪耳?댄봽",
              regionName: "?쒖슱 媛뺣궓",
              thumbnailUrl: null,
              favoriteCount: 12,
              isFavorite: true,
            },
          ],
          totalCount: 1,
          hasMore: false,
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

    await getFavoriteThemesSummary();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/favorites/summary",
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
              crewName: "諛⑺깉異??щ（",
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

  it("requests the pending crews list from the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              joinRequestId: 91,
              crewId: 17,
              crewName: "諛⑺깉異??щ（",
              requestedAt: "2026-04-17T09:00:00Z",
              messageSummary: "二쇰쭚 ?꾩＜濡?李몄뿬?섍퀬 ?띠뼱??",
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

    await getPendingCrews({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/pending-crews?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("requests the withdrawal check from the profile guard API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          canWithdraw: false,
          blockingActiveCrews: [
            {
              crewId: 17,
              crewName: "諛⑺깉異??щ（",
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

    await getWithdrawalCheck();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/withdrawal-check",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts the withdrawal execution request to the users API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          withdrawnAt: "2026-04-19T10:00:00Z",
          canLogin: false,
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

    await withdrawUser({
      reasonCode: "OTHER",
      reasonDetail: "?ъ뼱媛?ㅺ퀬 ?댁슂.",
      confirmationChecked: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/users/me/withdrawal",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
        body: JSON.stringify({
          reasonCode: "OTHER",
          reasonDetail: "?ъ뼱媛?ㅺ퀬 ?댁슂.",
          confirmationChecked: true,
        }),
      }),
    );
  });

  it("cancels a pending crew join request through the profile activity API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: 91,
          crewId: 17,
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

    await cancelPendingCrew(91);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/join-requests/91/cancel",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
        }),
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
            message: "?몄쬆???꾩슂?⑸땲??",
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
      message: "?몄쬆???꾩슂?⑸땲??",
      userMessage: "?몄쬆???꾩슂?⑸땲??",
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
            message: "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.",
            requestId: "req-complete-1",
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
      completeProfile({
        nickname: "",
        agreedToRequiredTerms: true,
      }),
    ).rejects.toMatchObject({
      code: "COMMON_VALIDATION_ERROR",
      message: "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.",
      requestId: "req-complete-1",
      status: 400,
      fieldErrors: [
        {
          field: "nickname",
          message: "?됰꽕?꾩? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.",
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
            message: "??낆젾揶쏅?????而?몴?? ??녿뮸??덈뼄.",
            requestId: "req-profile-1",
            fieldErrors: [
              {
                field: "nickname",
                message: "??곌퐬?袁? ??쑴堉???됱뱽 ????곷뮸??덈뼄.",
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
      message: "??낆젾揶쏅?????而?몴?? ??녿뮸??덈뼄.",
      requestId: "req-profile-1",
      status: 400,
      fieldErrors: [
        {
          field: "nickname",
          message: "??곌퐬?袁? ??쑴堉???됱뱽 ????곷뮸??덈뼄.",
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

