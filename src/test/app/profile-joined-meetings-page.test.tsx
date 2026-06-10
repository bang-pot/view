import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JoinedMeetingsProfilePage from "@/app/profile/joined-meetings/page";
import { getJoinedMeetings, getMe } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getJoinedMeetings: vi.fn(),
}));

describe("JoinedMeetingsProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the joined meetings list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/joined-meetings",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<JoinedMeetingsProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprofile%2Fjoined-meetings",
      );
    });
    expect(getJoinedMeetings).not.toHaveBeenCalled();
  });

  it("renders joined meeting items and only shows 리뷰 작성하기 when canWriteReview is true", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getJoinedMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 41,
          title: "금요일 방탈출",
          themeName: "더 킹덤",
          crewId: 7,
          crewName: "방로그 크루",
          date: "2026-04-25",
          time: "19:00",
          status: "COMPLETED",
          canWriteReview: true,
        },
        {
          meetingId: 42,
          title: "토요일 방탈출",
          themeName: "더 프리즌",
          crewId: 8,
          crewName: "서브 크루",
          date: "2026-04-26",
          time: "14:00",
          status: "COMPLETED",
          canWriteReview: false,
        },
        {
          meetingId: 43,
          title: "일요일 방탈출",
          themeName: "더 랩",
          crewId: 9,
          crewName: "세 번째 크루",
          date: "2026-04-27",
          time: "11:00",
          status: "RECRUITING",
          canWriteReview: false,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<JoinedMeetingsProfilePage />);

    expect(await screen.findByRole("heading", { name: "내가 참여한 모임" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "진행 중 모임" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지난 모임" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /금요일 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/7/meetings/41",
    );
    expect(screen.getByText("더 킹덤")).toBeInTheDocument();
    expect(screen.getAllByText("방로그 크루")).toHaveLength(2);
    expect(screen.getByText("2026. 04. 25 (토) 19:00")).toBeInTheDocument();
    expect(screen.getAllByText("마감")).toHaveLength(2);
    expect(
      screen.getAllByText((_, element) => element?.textContent === "탈출 진행도 : 완료"),
    ).toHaveLength(2);
    expect(screen.getByText("모집중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "리뷰 작성하기" })).toHaveAttribute(
      "href",
      "/crews/7/meetings/41",
    );
    expect(screen.getByRole("link", { name: /토요일 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/8/meetings/42",
    );
    expect(screen.queryAllByRole("link", { name: "리뷰 작성하기" })).toHaveLength(1);
  });

  it("shows an empty state when the user has no joined meetings in the list response", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getJoinedMeetings).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<JoinedMeetingsProfilePage />);

    expect(await screen.findByText("아직 참여한 모임이 없어요.")).toBeInTheDocument();
  });

  it("loads the next page with a 더 보기 button and keeps existing items merged", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getJoinedMeetings)
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 41,
            title: "금요일 방탈출",
            themeName: "더 킹덤",
            crewId: 7,
            crewName: "방로그 크루",
            date: "2026-04-25",
            time: "19:00",
            status: "COMPLETED",
            canWriteReview: true,
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
            meetingId: 41,
            title: "금요일 방탈출",
            themeName: "더 킹덤",
            crewId: 7,
            crewName: "방로그 크루",
            date: "2026-04-25",
            time: "19:00",
            status: "COMPLETED",
            canWriteReview: true,
          },
          {
            meetingId: 44,
            title: "심야 방탈출",
            themeName: "더 에스케이프",
            crewId: 7,
            crewName: "방로그 크루",
            date: "2026-04-29",
            time: "22:00",
            status: "RECRUITMENT_CLOSED",
            canWriteReview: false,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<JoinedMeetingsProfilePage />);

    const loadMoreButton = await screen.findByRole("button", { name: "더 보기" });
    fireEvent.click(loadMoreButton);

    expect(await screen.findByRole("link", { name: /심야 방탈출/ })).toHaveAttribute(
      "href",
      "/crews/7/meetings/44",
    );
    expect(screen.getAllByRole("link", { name: /금요일 방탈출/ })).toHaveLength(1);
  });

  it("shows an error with a retry affordance when the first load fails", async () => {
    const error = new Error("boom");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getJoinedMeetings)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        items: [
          {
            meetingId: 41,
            title: "금요일 방탈출",
            themeName: "더 킹덤",
            crewId: 7,
            crewName: "방로그 크루",
            date: "2026-04-25",
            time: "19:00",
            status: "COMPLETED",
            canWriteReview: true,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<JoinedMeetingsProfilePage />);

    expect(
      await screen.findByText("참여 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("link", { name: /금요일 방탈출/ })).toBeInTheDocument();
  });
});
