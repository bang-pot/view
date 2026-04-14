import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MeetingLogEditorPage from "@/app/crews/[crewId]/meetings/[meetingId]/log/page";
import { getMe } from "@/shared/auth/client";
import { OperationalError } from "@/shared/errors/operational";
import { getMeetingDetail } from "@/shared/meeting/client";
import {
  createMeetingLog,
  deleteMeetingLog,
  getMeetingLogDetail,
  getMyMeetingLog,
  uploadLogPhoto,
  updateMeetingLog,
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

vi.mock("@/shared/meeting/client", () => ({
  getMeetingDetail: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  createMeetingLog: vi.fn(),
  updateMeetingLog: vi.fn(),
  deleteMeetingLog: vi.fn(),
  getMyMeetingLog: vi.fn(),
  getMeetingLogDetail: vi.fn(),
  uploadLogPhoto: vi.fn(),
}));

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "bangpot" },
    requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
  });
}

function mockCompletedMeeting(
  overrides: Partial<Awaited<ReturnType<typeof getMeetingDetail>>> = {},
) {
  vi.mocked(getMeetingDetail).mockResolvedValue({
    meetingId: 99,
    crewId: 11,
    hostUserId: 1,
    title: "금요일 방탈출 번개",
    themeName: "미스터리 룸",
    place: "강남 이스케이프",
    date: "2026-04-10",
    time: "19:30",
    capacity: 4,
    totalCost: null,
    contactLink: null,
    description: null,
    status: "COMPLETED",
    result: "SUCCESS",
    myParticipationStatus: "JOINED",
    ...overrides,
  });
}

function createImageFile(name: string, size: number, type: string) {
  const file = new File(["image"], name, { type });
  Object.defineProperty(file, "size", {
    value: size,
    configurable: true,
  });
  return file;
}

describe("MeetingLogEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guests before showing the log editor", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?redirectTo=%2Fcrews%2F11%2Fmeetings%2F99%2Flog",
      );
    });
  });

  it("creates a new log and routes to the log detail", async () => {
    mockFullUser();
    mockCompletedMeeting();
    vi.mocked(getMyMeetingLog).mockResolvedValue(null);
    vi.mocked(uploadLogPhoto).mockResolvedValue({
      url: "https://cdn.example.com/log-1.jpg",
      sizeBytes: 1024,
    });
    vi.mocked(createMeetingLog).mockResolvedValue({ logId: 501, meetingId: 99 });

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 작성하기" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("후기 본문"), {
      target: { value: "정말 재미있었던 모임이었어요." },
    });
    fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
    fireEvent.change(screen.getByLabelText("사진 파일 1"), {
      target: { files: [createImageFile("log-1.jpg", 1024, "image/jpeg")] },
    });
    expect(await screen.findByText("업로드 완료")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "방탈로그 저장" }));

    await waitFor(() => {
      expect(uploadLogPhoto).toHaveBeenCalled();
      expect(createMeetingLog).toHaveBeenCalledWith(99, {
        body: "정말 재미있었던 모임이었어요.",
        photos: [{ url: "https://cdn.example.com/log-1.jpg", sizeBytes: 1024 }],
      });
    });

    expect(pushMock).toHaveBeenCalledWith("/logs/501");
  });

  it("loads an existing log for editing and supports delete", async () => {
    mockFullUser();
    mockCompletedMeeting();
    vi.mocked(getMyMeetingLog).mockResolvedValue({ logId: 501, meetingId: 99 });
    vi.mocked(getMeetingLogDetail).mockResolvedValue({
      logId: 501,
      meetingId: 99,
      meetingTitle: "금요일 방탈출 번개",
      themeName: "미스터리 룸",
      place: "강남 이스케이프",
      date: "2026-04-10",
      authorNickname: "bangpot",
      createdAt: "2026-04-11T10:00:00Z",
      updatedAt: "2026-04-11T11:00:00Z",
      body: "기존 로그예요.",
      photos: ["https://cdn.example.com/log-1.png"],
    });
    vi.mocked(updateMeetingLog).mockResolvedValue({ logId: 501, meetingId: 99 });
    vi.mocked(deleteMeetingLog).mockResolvedValue({ logId: 501 });

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 수정하기" })).toBeInTheDocument();
    expect(screen.getByLabelText("후기 본문")).toHaveValue("기존 로그예요.");
    expect(screen.getByText("기존 사진")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("후기 본문"), {
      target: { value: "수정된 로그예요." },
    });
    fireEvent.click(screen.getByRole("button", { name: "방탈로그 수정" }));

    await waitFor(() => {
      expect(updateMeetingLog).toHaveBeenCalledWith(501, {
        body: "수정된 로그예요.",
        photos: [{ url: "https://cdn.example.com/log-1.png", sizeBytes: 1 }],
      });
    });

    expect(pushMock).toHaveBeenCalledWith("/logs/501");

    pushMock.mockReset();
    fireEvent.click(screen.getByRole("button", { name: "방탈로그 삭제" }));

    await waitFor(() => {
      expect(deleteMeetingLog).toHaveBeenCalledWith(501);
    });

    expect(await screen.findByRole("heading", { name: "방탈로그 작성하기" })).toBeInTheDocument();
  });

  it("shows a validation message when a photo violates the constraints", async () => {
    mockFullUser();
    mockCompletedMeeting();
    vi.mocked(getMyMeetingLog).mockResolvedValue(null);

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 작성하기" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("후기 본문"), {
      target: { value: "정말 재미있었던 모임이었어요." },
    });
    fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
    fireEvent.change(screen.getByLabelText("사진 파일 1"), {
      target: { files: [createImageFile("log-1.gif", 1024, "image/gif")] },
    });

    expect(
      await screen.findByText("사진은 jpg, jpeg, png 형식만 첨부할 수 있어요."),
    ).toBeInTheDocument();
    expect(uploadLogPhoto).not.toHaveBeenCalled();
    expect(createMeetingLog).not.toHaveBeenCalled();
  });

  it("shows an error when photo upload fails", async () => {
    mockFullUser();
    mockCompletedMeeting();
    vi.mocked(getMyMeetingLog).mockResolvedValue(null);
    vi.mocked(uploadLogPhoto).mockRejectedValue(
      new OperationalError({
        code: "LOG_PHOTO_UPLOAD_FAILED",
        message: "사진을 업로드하지 못했어요.",
        requestId: "req-upload-failed",
        status: 500,
      }),
    );

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 작성하기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
    fireEvent.change(screen.getByLabelText("사진 파일 1"), {
      target: { files: [createImageFile("log-1.jpg", 1024, "image/jpeg")] },
    });

    expect(
      await screen.findByText("사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("shows a not-allowed message when the meeting cannot be logged", async () => {
    mockFullUser();
    mockCompletedMeeting({
      status: "RECRUITMENT_CLOSED",
      result: "NOT_RECORDED",
      hostUserId: 44,
      myParticipationStatus: "NOT_JOINED",
    });
    vi.mocked(getMyMeetingLog).mockResolvedValue(null);

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByText("이 모임은 지금 방탈로그를 작성할 수 없어요.")).toBeInTheDocument();
  });

  it("redirects non-members to the public crew introduction", async () => {
    mockFullUser();
    vi.mocked(getMeetingDetail).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-log-editor-1",
        status: 403,
      }),
    );

    render(
      await MeetingLogEditorPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
