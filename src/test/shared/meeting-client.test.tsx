import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeeting,
  getMeetingDetail,
  getMeetings,
  requestMeetingParticipation,
} from "@/shared/meeting/client";

const ORIGINAL_ENV = { ...process.env };

describe("meeting client", () => {
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

  it("posts a meeting create request with the backend contract fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          crewId: 11,
          themeName: "세븐클루스",
          place: "강남점",
          date: "2026-04-20",
          time: "19:30",
          status: "RECRUITING",
          result: "NOT_RECORDED",
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

    await createMeeting(11, {
      date: "2026-04-20",
      time: "19:30",
      place: "강남점",
      themeName: "세븐클루스",
      capacity: 4,
      totalCost: 120000,
      reservationLink: "https://example.com/reserve",
      openChatLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: "2026-04-20",
          time: "19:30",
          place: "강남점",
          themeName: "세븐클루스",
          capacity: 4,
          totalCost: 120000,
          reservationLink: "https://example.com/reserve",
          openChatLink: "https://open.kakao.com/o/example",
          description: "지각 없이 모여 주세요.",
        }),
      }),
    );
  });

  it("loads the crew meetings list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getMeetings(11);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("loads the meeting detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          crewId: 11,
          hostUserId: 1,
          themeName: "세븐클루스",
          place: "강남점",
          date: "2026-04-20",
          time: "19:30",
          capacity: 4,
          totalCost: null,
          reservationLink: null,
          openChatLink: null,
          description: null,
          status: "RECRUITING",
          result: "NOT_RECORDED",
          myParticipationStatus: "NOT_REQUESTED",
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

    await getMeetingDetail(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("posts a participation request for the current meeting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          myParticipationStatus: "PENDING",
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

    await requestMeetingParticipation(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/participation-requests",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });
});
