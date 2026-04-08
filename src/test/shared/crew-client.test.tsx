import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCrew,
  createCrewJoinRequest,
  getPublicCrewJoinView,
  getPublicCrews,
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

  it("loads public crews from the backend discovery contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            crewId: 11,
            name: "BangPot Runners",
            description: "Morning runners",
            visibility: "PUBLIC",
            imageUrl: null,
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

    await getPublicCrews();

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/public",
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
});
