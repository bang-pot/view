import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewLogDetailPage from "@/app/crews/[crewId]/logs/[logId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import {
  deleteMeetingLog,
  getCrewLogDetail,
  getMyMeetingLog,
} from "@/shared/log/client";

const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/crew/client", () => ({
  getCrewHub: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getCrewLogDetail: vi.fn(),
  getMyMeetingLog: vi.fn(),
  deleteMeetingLog: vi.fn(),
}));

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "banglog" },
    requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
  });
}

function mockCrew(role: "LEADER" | "MEMBER") {
  vi.mocked(getCrewHub).mockResolvedValue({
    crewId: 11,
    name: "night runners",
    description: null,
    visibility: "PRIVATE",
    imageUrl: null,
    myRole: role,
    hasNotice: false,
    pendingJoinRequestCount: 0,
  });
}

function mockCrewLogDetail() {
  vi.mocked(getCrewLogDetail).mockResolvedValue({
    logId: 501,
    meetingId: 99,
    meetingTitle: "금요일 방탈출 번개",
    themeName: "미스터리 룸",
    place: "강남 이스케이프",
    date: "2026-04-10",
    authorNickname: "banglog",
    createdAt: "2026-04-11T10:00:00Z",
    updatedAt: "2026-04-11T11:00:00Z",
    body: "정말 재미있었던 모임이었어요.",
    photos: [
      "https://cdn.example.com/log-1.jpg",
      "https://cdn.example.com/log-2.jpg",
      "https://cdn.example.com/log-3.jpg",
      "https://cdn.example.com/log-4.jpg",
    ],
  });
}

function makeNotWrittenLog() {
  return {
    status: "NOT_WRITTEN" as const,
    logId: null,
    meetingId: 99,
    meetingTitle: null,
    themeName: null,
    place: null,
    date: null,
    authorNickname: null,
    createdAt: null,
    updatedAt: null,
    body: null,
    photos: [],
  };
}

function makeExistingLog() {
  return {
    status: "EXISTS" as const,
    logId: 501,
    meetingId: 99,
    meetingTitle: "금요일 방탈출 번개",
    themeName: "미스터리 룸",
    place: "강남 이스케이프",
    date: "2026-04-10",
    authorNickname: "banglog",
    createdAt: "2026-04-11T10:00:00Z",
    updatedAt: "2026-04-11T11:00:00Z",
    body: "정말 재미있었던 모임이었어요.",
    photos: [
      "https://cdn.example.com/log-1.jpg",
      "https://cdn.example.com/log-2.jpg",
      "https://cdn.example.com/log-3.jpg",
      "https://cdn.example.com/log-4.jpg",
    ],
  };
}

describe("CrewLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the saved crew-scoped log detail for a signed-in member", async () => {
    mockFullUser();
    mockCrew("MEMBER");
    mockCrewLogDetail();
    vi.mocked(getMyMeetingLog).mockResolvedValue(makeExistingLog());

    render(
      await CrewLogDetailPage({
        params: Promise.resolve({ crewId: "11", logId: "501" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "크루 방탈로그 상세" })).toBeInTheDocument();
    expect(screen.getByText("금요일 방탈출 번개")).toBeInTheDocument();
    expect(screen.getByText("정말 재미있었던 모임이었어요.")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /사진 \d 보기/ })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "사진 2 보기" }));

    const dialog = await screen.findByRole("dialog", { name: "방탈로그 사진 크게 보기" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByText("2 / 4")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("lets the author delete their own log and redirects to the crew feed", async () => {
    mockFullUser();
    mockCrew("MEMBER");
    mockCrewLogDetail();
    vi.mocked(getMyMeetingLog).mockResolvedValue(makeExistingLog());
    vi.mocked(deleteMeetingLog).mockResolvedValue({ logId: 501, deletedBy: "AUTHOR" });

    render(
      await CrewLogDetailPage({
        params: Promise.resolve({ crewId: "11", logId: "501" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "삭제" }));
    expect(
      await screen.findByRole("dialog", { name: "내 방탈로그 삭제 확인" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "삭제하기" }));

    await waitFor(() => {
      expect(deleteMeetingLog).toHaveBeenCalledWith(11, 501, undefined);
    });

    expect(pushMock).toHaveBeenCalledWith("/crews/11/logs?notice=deleted-own-log");
  });

  it("requires a delete reason when the crew leader deletes another member log", async () => {
    mockFullUser();
    mockCrew("LEADER");
    vi.mocked(getCrewLogDetail).mockResolvedValue({
      logId: 501,
      meetingId: 99,
      meetingTitle: "금요일 방탈출 번개",
      themeName: "미스터리 룸",
      place: "강남 이스케이프",
      date: "2026-04-10",
      authorNickname: "other-member",
      createdAt: "2026-04-11T10:00:00Z",
      updatedAt: "2026-04-11T11:00:00Z",
      body: "리더가 읽는 다른 사람 로그입니다.",
      photos: [],
    });
    vi.mocked(getMyMeetingLog).mockResolvedValue(makeNotWrittenLog());
    vi.mocked(deleteMeetingLog).mockResolvedValue({ logId: 501, deletedBy: "LEADER" });

    render(
      await CrewLogDetailPage({
        params: Promise.resolve({ crewId: "11", logId: "501" }),
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "삭제" }));
    expect(await screen.findByRole("dialog", { name: "운영 삭제 확인" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "삭제하기" }));

    expect(deleteMeetingLog).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("삭제 사유"), {
      target: { value: "스포일러 포함 후기라 운영 삭제합니다." },
    });
    fireEvent.click(screen.getByRole("button", { name: "삭제하기" }));

    await waitFor(() => {
      expect(deleteMeetingLog).toHaveBeenCalledWith(
        11,
        501,
        "스포일러 포함 후기라 운영 삭제합니다.",
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/crews/11/logs?notice=deleted-crew-log");
  });

  it("hides delete for a non-author member and hides photo section when photos are absent", async () => {
    mockFullUser();
    mockCrew("MEMBER");
    vi.mocked(getCrewLogDetail).mockResolvedValue({
      logId: 501,
      meetingId: 99,
      meetingTitle: "금요일 방탈출 번개",
      themeName: "미스터리 룸",
      place: "강남 이스케이프",
      date: "2026-04-10",
      authorNickname: "other-member",
      createdAt: "2026-04-11T10:00:00Z",
      updatedAt: "2026-04-11T11:00:00Z",
      body: "사진 없는 로그예요.",
      photos: [],
    });
    vi.mocked(getMyMeetingLog).mockResolvedValue(makeNotWrittenLog());

    render(
      await CrewLogDetailPage({
        params: Promise.resolve({ crewId: "11", logId: "501" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "크루 방탈로그 상세" })).toBeInTheDocument();
    expect(screen.getByText("사진 없는 로그예요.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "사진" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
  });
});
