import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileLogsPage from "@/app/profile/logs/page";
import { getMe, getMyMeetingLogs } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getMyMeetingLogs: vi.fn(),
}));

describe("ProfileLogsPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the authored meeting log list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/logs",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfileLogsPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fprofile%2Flogs");
    });
    expect(getMyMeetingLogs).not.toHaveBeenCalled();
  });

  it("renders only my authored meeting logs and links them to the existing crew-scoped detail page", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyMeetingLogs).mockResolvedValue({
      items: [
        {
          logId: 501,
          crewId: 31,
          crewName: "Alpha Crew",
          meetingId: 201,
          meetingTitle: "Friday Escape",
          meetingDate: "2026-04-18",
          createdAt: "2026-04-19T10:15:30Z",
          excerpt: "내가 직접 쓴 방탈로그 요약",
          coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
          result: "SUCCESS",
          photoCount: 3,
        },
        {
          logId: 502,
          crewId: 32,
          crewName: "Beta Crew",
          meetingId: 202,
          meetingTitle: "Sunday Revenge",
          meetingDate: "2026-04-20",
          createdAt: "2026-04-20T12:00:00Z",
          excerpt: "",
          coverPhotoUrl: null,
          result: "FAILURE",
          photoCount: 0,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<ProfileLogsPage />);

    expect(await screen.findByRole("heading", { name: "내 방탈로그" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Friday Escape/ })).toHaveAttribute(
      "href",
      "/crews/31/logs/501",
    );
    expect(screen.getByRole("link", { name: /Sunday Revenge/ })).toHaveAttribute(
      "href",
      "/crews/32/logs/502",
    );
    expect(screen.getByText("Alpha Crew")).toBeInTheDocument();
    expect(screen.getByText("내가 직접 쓴 방탈로그 요약")).toBeInTheDocument();
    expect(screen.getByText("사진 3장")).toBeInTheDocument();
    expect(screen.getAllByText("사진 없음").length).toBeGreaterThan(0);
  });

  it("shows an empty state when the user has no authored meeting logs", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyMeetingLogs).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<ProfileLogsPage />);

    expect(await screen.findByText("아직 작성한 방탈로그가 없어요")).toBeInTheDocument();
  });

  it("loads the next page with a 더보기 button and keeps existing items merged", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyMeetingLogs)
      .mockResolvedValueOnce({
        items: [
          {
            logId: 501,
            crewId: 31,
            crewName: "Alpha Crew",
            meetingId: 201,
            meetingTitle: "Friday Escape",
            meetingDate: "2026-04-18",
            createdAt: "2026-04-19T10:15:30Z",
            excerpt: "첫 번째 기록",
            coverPhotoUrl: null,
            result: "SUCCESS",
            photoCount: 0,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            logId: 501,
            crewId: 31,
            crewName: "Alpha Crew",
            meetingId: 201,
            meetingTitle: "Friday Escape",
            meetingDate: "2026-04-18",
            createdAt: "2026-04-19T10:15:30Z",
            excerpt: "첫 번째 기록",
            coverPhotoUrl: null,
            result: "SUCCESS",
            photoCount: 0,
          },
          {
            logId: 503,
            crewId: 33,
            crewName: "Gamma Crew",
            meetingId: 203,
            meetingTitle: "Late Night Escape",
            meetingDate: "2026-04-21",
            createdAt: "2026-04-21T21:00:00Z",
            excerpt: "두 번째 기록",
            coverPhotoUrl: null,
            result: "SUCCESS",
            photoCount: 1,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<ProfileLogsPage />);

    const loadMoreButton = await screen.findByRole("button", { name: "더보기" });
    fireEvent.click(loadMoreButton);

    expect(await screen.findByRole("link", { name: /Late Night Escape/ })).toHaveAttribute(
      "href",
      "/crews/33/logs/503",
    );
    expect(screen.getAllByRole("link", { name: /Friday Escape/ })).toHaveLength(1);
  });

  it("shows an error with a retry affordance when the first load fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyMeetingLogs)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            logId: 501,
            crewId: 31,
            crewName: "Alpha Crew",
            meetingId: 201,
            meetingTitle: "Friday Escape",
            meetingDate: "2026-04-18",
            createdAt: "2026-04-19T10:15:30Z",
            excerpt: "첫 번째 기록",
            coverPhotoUrl: null,
            result: "SUCCESS",
            photoCount: 0,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<ProfileLogsPage />);

    expect(
      await screen.findByText("내 방탈로그 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("link", { name: /Friday Escape/ })).toBeInTheDocument();
  });
});
