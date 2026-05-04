import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveCrewJoinRequest,
  createCrew,
  createCrewInvite,
  createCrewJoinRequest,
  deleteCrew,
  removeCrewMember,
  transferCrewLeadership,
  leaveCrew,
  updateCrewVisibility,
  getCrewHub,
  getCrewSchedule,
  getCrewMembers,
  getCrewPolicies,
  getCrewJoinRequests,
  getCrewInviteCandidates,
  getPendingCrewJoinRequests,
  getPublicCrewJoinView,
  getExploreCrews,
  getMyCrewInvites,
  rejectCrewJoinRequest,
} from "@/shared/crew/client";

const ORIGINAL_ENV = { ...process.env };

describe("crew client", () => {
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

  it("posts a crew create request with the backend contract fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 21,
          name: "BangPot Crew",
          myRole: "LEADER",
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

    await createCrew({
      name: "BangPot Crew",
      description: "crew intro",
      visibility: "PUBLIC",
      imageUrl: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "BangPot Crew",
          description: "crew intro",
          visibility: "PUBLIC",
          imageUrl: null,
        }),
      }),
    );
  });

  it("keeps duplicate crew name field errors from the backend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "CREW_DUPLICATE_NAME",
            message: "이미 사용 중인 크루명입니다.",
            requestId: "req-crew-1",
            fieldErrors: [
              {
                field: "name",
                message: "이미 사용 중인 크루명입니다.",
              },
            ],
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(
      createCrew({
        name: "BangPot Crew",
        description: null,
        visibility: "PUBLIC",
        imageUrl: null,
      }),
    ).rejects.toMatchObject({
      code: "CREW_DUPLICATE_NAME",
      requestId: "req-crew-1",
      status: 409,
      fieldErrors: [
        {
          field: "name",
          message: "이미 사용 중인 크루명입니다.",
        },
      ],
      path: "/api/crews",
    });
  });

  it("loads explore crews from the backend discovery contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              crewId: 11,
              name: "BangPot Runners",
              description: "Morning runners",
              imageUrl: null,
              visibility: "PRIVATE",
              leaderNickname: "leader-one",
              memberCount: 12,
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

    await getExploreCrews({
      page: 0,
      size: 20,
      keyword: "방탈",
      sort: "MEMBER_COUNT_DESC",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/explore?page=0&size=20&keyword=%EB%B0%A9%ED%83%88&sort=MEMBER_COUNT_DESC",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("loads the public crew join view with the member status contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          name: "BangPot Runners",
          description: "Morning runners",
          visibility: "PUBLIC",
          imageUrl: null,
          myStatus: "MEMBER",
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

    await getPublicCrewJoinView(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/join",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts join request messages and keeps message field errors from the backend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "COMMON_VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            requestId: "req-join-message-1",
            fieldErrors: [
              {
                field: "message",
                message: "신청 메시지는 200자 이하여야 합니다.",
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
      createCrewJoinRequest(11, {
        message: "x".repeat(201),
      }),
    ).rejects.toMatchObject({
      code: "COMMON_VALIDATION_ERROR",
      requestId: "req-join-message-1",
      status: 400,
      fieldErrors: [
        {
          field: "message",
          message: "신청 메시지는 200자 이하여야 합니다.",
        },
      ],
      path: "/api/crews/11/join-requests",
    });
  });

  it("loads the crew leader pending join request summary for the crew main page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            requestId: 91,
            userId: 7,
            nickname: "runner7",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getPendingCrewJoinRequests(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/join-requests/pending",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads the internal crew hub contract for members", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          name: "Night runners",
          description: "Private crew for late runners",
          visibility: "PRIVATE",
          imageUrl: null,
          myRole: "LEADER",
          hasNotice: true,
          pendingJoinRequestCount: 2,
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

    await getCrewHub(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("patches the crew visibility setting for leaders", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          visibility: "PRIVATE",
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

    await updateCrewVisibility(11, "PRIVATE");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/visibility",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visibility: "PRIVATE",
        }),
      }),
    );
  });

  it("loads the crew schedule contract with a from/to range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              meetingId: 91,
              themeName: "Abyss",
              date: "2026-05-15",
              time: "19:00",
              meetingStatus: "RECRUITING",
              recruitmentStatus: "OPEN",
              place: "Gangnam Branch",
              participantCount: 4,
              isCanceled: false,
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

    await getCrewSchedule(11, {
      from: "2026-05-01",
      to: "2026-05-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/schedule?from=2026-05-01&to=2026-05-31",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts a crew leave request for joined members", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
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

    await leaveCrew(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/leave",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a leadership transfer request for the target member", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          leaderUserId: 22,
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

    await transferCrewLeadership(11, 22);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/transfer-leadership",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: 22,
        }),
      }),
    );
  });

  it("posts a member removal request for the target member", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          removedUserId: 22,
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

    await removeCrewMember(11, 22);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/members/22/remove",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a crew delete request with the crew name confirmation body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
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

    await deleteCrew(11, "Night runners");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/delete",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crewName: "Night runners",
        }),
      }),
    );
  });

  it("loads the crew member list contract for joined members", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            userId: 11,
            nickname: "leader-one",
            profileImageUrl: null,
            bio: null,
            gender: null,
            escapeCount: 0,
            role: "LEADER",
            joinedAt: "2026-04-08T00:00:00Z",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewMembers(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/members",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads the crew policy list contract for joined members", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            policyId: 101,
            title: "모임 규칙",
            content: "지각 금지\n노쇼 금지",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewPolicies(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/policies",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads the crew join request management list with applicant message and status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            requestId: 91,
            userId: 7,
            nickname: "runner7",
            message: "Please let me join.",
            status: "PENDING",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewJoinRequests(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/join-requests",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts approve and reject actions to the crew join request management contract", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            crewId: 11,
            requestId: 91,
            userId: 7,
            role: "MEMBER",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            crewId: 11,
            requestId: 91,
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

    await approveCrewJoinRequest(11, 91);
    await rejectCrewJoinRequest(11, 91);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/backend/api/crews/11/join-requests/91/approve",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/backend/api/crews/11/join-requests/91/reject",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("loads invite candidates for a private crew with an optional nickname query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            userId: 12,
            nickname: "bangpot",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCrewInviteCandidates(11, "bang");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/invite-candidates?nickname=bang",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts a direct invite and keeps already joined/pending backend errors", async () => {
    const successFetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          crewId: 11,
          targetUserId: 12,
          status: "PENDING",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", successFetchMock);

    await createCrewInvite(11, 12);

    expect(successFetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/invites",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: 12,
        }),
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "CREW_INVITE_ALREADY_PENDING",
            message: "이미 pending 초대가 있는 사용자입니다.",
            requestId: "req-invite-pending-1",
            fieldErrors: [],
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(createCrewInvite(11, 12)).rejects.toMatchObject({
      code: "CREW_INVITE_ALREADY_PENDING",
      requestId: "req-invite-pending-1",
      status: 409,
      path: "/api/crews/11/invites",
    });
  });

  it("loads my crew invites with the paged backend contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              inviteId: 101,
              crewId: 11,
              crewName: "Night runners",
              inviterNickname: "leader-one",
              status: "PENDING",
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

    await getMyCrewInvites({
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crew-invites/me?page=0&size=20",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
