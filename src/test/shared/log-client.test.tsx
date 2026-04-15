import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeetingLog,
  deleteMeetingLog,
  getCrewLogDetail,
  getCrewLogFeed,
  getMeetingLogDetail,
  getMyMeetingLog,
  uploadLogPhoto,
  updateMeetingLog,
} from "@/shared/log/client";

const ORIGINAL_ENV = { ...process.env };

describe("log client", () => {
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

  it("posts a meeting log create request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ logId: 501, meetingId: 99 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createMeetingLog(99, {
      body: "정말 재미있었던 모임이었어요.",
      photos: [{ url: "https://cdn.example.com/logs/photo-1.jpg", sizeBytes: 1024 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/meetings/99/logs",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "정말 재미있었던 모임이었어요.",
          photos: [{ url: "https://cdn.example.com/logs/photo-1.jpg", sizeBytes: 1024 }],
        }),
      }),
    );
  });

  it("uploads a log photo as multipart form-data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://cdn.example.com/logs/photo-1.jpg", sizeBytes: 1024 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["photo"], "photo-1.jpg", { type: "image/jpeg" });

    await uploadLogPhoto(file);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/uploads/log-photos",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.any(FormData),
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = requestInit.body as FormData;
    expect(body.get("file")).toBe(file);
  });

  it("patches an existing meeting log", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ logId: 501, meetingId: 99 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateMeetingLog(501, { body: "수정된 방탈로그예요.", photos: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/logs/501",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "수정된 방탈로그예요.", photos: [] }),
      }),
    );
  });

  it("deletes an authored meeting log through the crew-scoped endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ logId: 501, deletedBy: "AUTHOR" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await deleteMeetingLog(11, 501);

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/logs/501",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteReason: null }),
      }),
    );
  });

  it("includes a delete reason when the crew leader deletes a log", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ logId: 501, deletedBy: "LEADER" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await deleteMeetingLog(11, 501, "스포일러 포함 후기라 운영 삭제합니다.");

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/logs/501",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteReason: "스포일러 포함 후기라 운영 삭제합니다.",
        }),
      }),
    );
  });

  it("returns null when the current user has not written a log for the meeting yet", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "LOG_NOT_FOUND",
          message: "로그를 찾을 수 없습니다.",
          requestId: "req-log-not-found-1",
          fieldErrors: [],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMyMeetingLog(99)).resolves.toBeNull();
  });

  it("loads the current user's meeting log summary and standalone log detail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ logId: 501, meetingId: 99 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            logId: 501,
            meetingId: 99,
            meetingTitle: "금요일 방탈출 번개",
            themeName: "미스터리 룸",
            place: "강남 이스케이프",
            date: "2026-04-10",
            authorNickname: "bangpot",
            createdAt: "2026-04-11T10:00:00Z",
            updatedAt: "2026-04-11T11:00:00Z",
            body: "정말 재미있었어요.",
            photos: [],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMyMeetingLog(99)).resolves.toEqual({ logId: 501, meetingId: 99 });
    await expect(getMeetingLogDetail(501)).resolves.toMatchObject({
      logId: 501,
      meetingId: 99,
      meetingTitle: "금요일 방탈출 번개",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/backend/api/meetings/99/logs/me",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/backend/api/logs/501",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("loads a crew log feed page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              logId: 700,
              meetingId: 99,
              authorNickname: "bangpot",
              meetingTitle: "금요일 방탈출 번개",
              meetingDate: "2026-04-10",
              createdAt: "2026-04-11T10:00:00Z",
              excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
              coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
              extraPhotoCount: 2,
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
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCrewLogFeed(11, { page: 0, size: 20 })).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          logId: 700,
          excerpt: "정답 모여쓰기 감각이 좋았던 기록이에요.",
          extraPhotoCount: 2,
        }),
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/logs?page=0&size=20",
      expect.objectContaining({ method: "GET", credentials: "include", cache: "no-store" }),
    );
  });

  it("loads a crew-scoped log detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          logId: 700,
          meetingId: 99,
          meetingTitle: "금요일 방탈출 번개",
          themeName: "미스터리 룸",
          place: "강남 이스케이프",
          date: "2026-04-10",
          authorNickname: "bangpot",
          createdAt: "2026-04-11T10:00:00Z",
          updatedAt: "2026-04-11T11:00:00Z",
          body: "정말 재미있었어요.",
          photos: ["https://cdn.example.com/log-cover.jpg"],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCrewLogDetail(11, 700)).resolves.toMatchObject({
      logId: 700,
      meetingId: 99,
      meetingTitle: "금요일 방탈출 번개",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/crews/11/logs/700",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });
});
