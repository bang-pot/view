import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CreatedMeetingsProfilePage from "@/app/profile/created-meetings/page";
import { getCreatedMeetings, getMe } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getCreatedMeetings: vi.fn(),
}));

describe("CreatedMeetingsProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the created meetings list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/created-meetings",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<CreatedMeetingsProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprofile%2Fcreated-meetings",
      );
    });
    expect(getCreatedMeetings).not.toHaveBeenCalled();
  });

  it("renders the created meetings list and links each item to the existing meeting detail page", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCreatedMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 31,
          title: "토요일 방탈출",
          status: "RECRUITING",
          date: "2026-04-20",
          time: "14:00",
          crewId: 7,
          crewName: "방팟 크루",
        },
        {
          meetingId: 32,
          title: "일요일 방탈출",
          status: "COMPLETED",
          date: "2026-04-21",
          time: "18:30",
          crewId: 8,
          crewName: "서브 크루",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<CreatedMeetingsProfilePage />);

    expect(await screen.findByRole("heading", { name: "생성 모임" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /토요일 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/7/meetings/31",
    );
    expect(screen.getByRole("link", { name: /일요일 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/8/meetings/32",
    );
    expect(screen.getByText("모집 중")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("방팟 크루")).toBeInTheDocument();
    expect(screen.getByText("2026-04-20 14:00")).toBeInTheDocument();
  });

  it("shows an empty state when the user has no created meetings in the list response", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCreatedMeetings).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<CreatedMeetingsProfilePage />);

    expect(await screen.findByText("아직 만든 모임이 없어요.")).toBeInTheDocument();
  });

  it("loads the next page with a 더 보기 button and keeps existing items merged", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCreatedMeetings)
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 31,
            title: "토요일 방탈출",
            status: "RECRUITING",
            date: "2026-04-20",
            time: "14:00",
            crewId: 7,
            crewName: "방팟 크루",
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
            meetingId: 31,
            title: "토요일 방탈출",
            status: "RECRUITING",
            date: "2026-04-20",
            time: "14:00",
            crewId: 7,
            crewName: "방팟 크루",
          },
          {
            meetingId: 33,
            title: "심야 방탈출",
            status: "RECRUITMENT_CLOSED",
            date: "2026-04-25",
            time: "21:00",
            crewId: 7,
            crewName: "방팟 크루",
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<CreatedMeetingsProfilePage />);

    const loadMoreButton = await screen.findByRole("button", { name: "더 보기" });
    fireEvent.click(loadMoreButton);

    expect(await screen.findByRole("link", { name: /심야 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/7/meetings/33",
    );
    expect(screen.getAllByRole("link", { name: /토요일 방탈출/ })).toHaveLength(1);
  });

  it("shows an error with a retry affordance when the first load fails", async () => {
    const error = new Error("boom");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCreatedMeetings)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 31,
            title: "토요일 방탈출",
            status: "RECRUITING",
            date: "2026-04-20",
            time: "14:00",
            crewId: 7,
            crewName: "방팟 크루",
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<CreatedMeetingsProfilePage />);

    expect(await screen.findByText("생성 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("link", { name: /토요일 방탈출/ })).toBeInTheDocument();
  });
});
