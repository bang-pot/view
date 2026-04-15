import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelMeeting,
  cancelMeetingJoin,
  closeMeetingRecruitment,
  completeMeeting,
  createMeeting,
  getCrewMeetingHistory,
  getMeetingDetail,
  getMeetings,
  joinMeeting,
  recordMeetingResult,
  reopenMeetingRecruitment,
  updateMeeting,
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
          hostUserId: 1,
          title: "금요일 한강 러닝",
          themeName: "러닝",
          place: "강남역",
          date: "2026-04-20",
          time: "19:30",
          capacity: 4,
          totalCost: 120000,
          contactLink: "https://open.kakao.com/o/example",
          description: "지각 없이 모여 주세요",
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
      title: "금요일 한강 러닝",
      date: "2026-04-20",
      time: "19:30",
      place: "강남역",
      themeName: "러닝",
      capacity: 4,
      totalCost: 120000,
      contactLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요",
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
          title: "금요일 한강 러닝",
          date: "2026-04-20",
          time: "19:30",
          place: "강남역",
          themeName: "러닝",
          capacity: 4,
          totalCost: 120000,
          contactLink: "https://open.kakao.com/o/example",
          description: "지각 없이 모여 주세요",
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
          title: "금요일 한강 러닝",
          themeName: "러닝",
          place: "강남역",
          date: "2026-04-20",
          time: "19:30",
          capacity: 4,
          totalCost: null,
          contactLink: null,
          description: null,
          status: "RECRUITING",
          result: "NOT_RECORDED",
          myParticipationStatus: "NOT_JOINED",
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

  it("patches meeting fields with the edit contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          crewId: 11,
          hostUserId: 1,
          title: "수정된 모임 제목",
          themeName: "보드게임",
          place: "성수",
          date: "2026-04-21",
          time: "20:00",
          capacity: 6,
          totalCost: 90000,
          contactLink: "https://open.kakao.com/o/updated",
          description: "수정된 설명",
          status: "RECRUITMENT_CLOSED",
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

    await updateMeeting(11, 99, {
      title: "수정된 모임 제목",
      themeName: "보드게임",
      place: "성수",
      date: "2026-04-21",
      time: "20:00",
      capacity: 6,
      totalCost: 90000,
      contactLink: "https://open.kakao.com/o/updated",
      description: "수정된 설명",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "수정된 모임 제목",
          themeName: "보드게임",
          place: "성수",
          date: "2026-04-21",
          time: "20:00",
          capacity: 6,
          totalCost: 90000,
          contactLink: "https://open.kakao.com/o/updated",
          description: "수정된 설명",
        }),
      }),
    );
  });

  it("posts an instant join request for the current meeting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          myParticipationStatus: "JOINED",
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

    await joinMeeting(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/join",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("deletes the current joined meeting participation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          myParticipationStatus: "NOT_JOINED",
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

    await cancelMeetingJoin(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/join",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      }),
    );
  });

  it("posts a close recruitment request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          status: "RECRUITMENT_CLOSED",
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

    await closeMeetingRecruitment(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/close-recruitment",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a reopen recruitment request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          status: "RECRUITING",
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

    await reopenMeetingRecruitment(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/reopen-recruitment",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a cancel meeting request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          status: "CANCELED",
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

    await cancelMeeting(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/cancel",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a complete meeting request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          status: "COMPLETED",
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

    await completeMeeting(11, 99);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/complete",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("posts a meeting result record", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          meetingId: 99,
          result: "SUCCESS",
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

    await recordMeetingResult(11, 99, "SUCCESS");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/meetings/99/result",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          result: "SUCCESS",
        }),
      }),
    );
  });

  it("loads completed meeting history for a crew", async () => {
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

    await getCrewMeetingHistory(11, {
      page: 0,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/history/meetings?page=0&size=20",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
