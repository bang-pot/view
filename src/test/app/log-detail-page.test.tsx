import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewLogDetailPage from "@/app/crews/[crewId]/logs/[logId]/page";
import { getMe } from "@/shared/auth/client";
import { getCrewLogDetail } from "@/shared/log/client";

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
  getCrewLogDetail: vi.fn(),
}));

describe("CrewLogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the saved crew-scoped log detail for a signed-in member", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogDetail).mockResolvedValue({
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
        "https://cdn.example.com/log-3.jpg",
        "https://cdn.example.com/log-4.jpg",
      ],
    });

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
  });

  it("hides the photo section when no photo exists", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 4, nickname: "guest" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewLogDetail).mockResolvedValue({
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
      await CrewLogDetailPage({
        params: Promise.resolve({ crewId: "11", logId: "501" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "크루 방탈로그 상세" })).toBeInTheDocument();
    expect(screen.getByText("사진 없는 로그예요.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "사진" })).not.toBeInTheDocument();
  });
});
