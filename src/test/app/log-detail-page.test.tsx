import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MeetingLogDetailPage from "@/app/logs/[logId]/page";
import { getMe } from "@/shared/auth/client";
import { getMeetingLogDetail } from "@/shared/log/client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getMeetingLogDetail: vi.fn(),
}));

describe("MeetingLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the saved log detail for a signed-in user", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
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
      body: "정말 재미있었던 모임이었어요.",
      photos: [
        "https://cdn.example.com/log-1.jpg",
        "https://cdn.example.com/log-2.jpg",
      ],
    });
    render(
      await MeetingLogDetailPage({
        params: Promise.resolve({ logId: "501" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 상세" })).toBeInTheDocument();
    expect(screen.getByText("금요일 방탈출 번개")).toBeInTheDocument();
    expect(screen.getByText("정말 재미있었던 모임이었어요.")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("shows a missing-photo fallback when no image exists", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 4, nickname: "guest" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
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
      body: "사진 없는 로그예요.",
      photos: [],
    });
    render(
      await MeetingLogDetailPage({
        params: Promise.resolve({ logId: "501" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "방탈로그 상세" })).toBeInTheDocument();
    expect(screen.getByText("사진 없는 로그예요.")).toBeInTheDocument();
    expect(screen.getByText("등록된 사진이 없어요.")).toBeInTheDocument();
  });
});
