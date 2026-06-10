import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileCrewsPage from "@/app/profile/crews/page";
import { getMe, getMyCrews, getPendingCrews } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getMyCrews: vi.fn(),
  getPendingCrews: vi.fn(),
}));

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "banglog" },
    requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
  });
}

describe("ProfileCrewsPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading crew lists", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/crews",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfileCrewsPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fprofile%2Fcrews");
    });
    expect(getMyCrews).not.toHaveBeenCalled();
    expect(getPendingCrews).not.toHaveBeenCalled();
  });

  it("renders pending crews and active crews in separate profile sections", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [
        {
          joinRequestId: 91,
          crewId: 17,
          crewName: "화요일 방팟",
          description: "매주 화요일 저녁 강남에서 모이는 추리 방탈출 크루입니다.",
          visibility: "PUBLIC",
          leaderNickname: "방탈매니아",
          coverImageUrl: null,
          memberCount: 3,
          requestedAt: "2026-04-17T09:00:00Z",
          messageSummary: "주말 위주로 참여하고 싶어요.",
        },
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [
        {
          crewId: 18,
          crewName: "금요일 스터디",
          description: "매주 금요일 저녁 추리에 서로의 깨달음을 남기는 독서 크루입니다.",
          visibility: "PRIVATE",
          leaderNickname: "힌트장인",
          coverImageUrl: "https://example.com/crew-cover.jpg",
          myRole: "MEMBER",
          memberCount: 5,
        },
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileCrewsPage />);

    expect(await screen.findByRole("heading", { name: "내가 속한 크루" })).toBeInTheDocument();
    expect(screen.getByText("내가 소속된 크루들입니다")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "가입 대기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "소속 크루" })).toBeInTheDocument();

    const pendingCard = screen.getByRole("link", { name: /화요일 방팟/ });
    expect(pendingCard).toHaveAttribute("href", "/crews/public/17");
    expect(within(pendingCard).getByText("가입 대기")).toBeInTheDocument();
    expect(within(pendingCard).getByText("공개 크루")).toBeInTheDocument();
    expect(within(pendingCard).getByText("3명")).toBeInTheDocument();
    expect(within(pendingCard).getByText("방장 방탈매니아")).toBeInTheDocument();
    expect(within(pendingCard).getByText(/매주 화요일 저녁/)).toBeInTheDocument();

    const activeCard = screen.getByRole("link", { name: /금요일 스터디/ });
    expect(activeCard).toHaveAttribute("href", "/crews/18");
    expect(within(activeCard).getByText("비공개 크루")).toBeInTheDocument();
    expect(within(activeCard).getByText("5명")).toBeInTheDocument();
    expect(within(activeCard).getByText("크루원")).toBeInTheDocument();
    expect(within(activeCard).getByAltText("금요일 스터디 대표 이미지")).toHaveAttribute(
      "src",
      "https://example.com/crew-cover.jpg",
    );
  });

  it("loads crew lists after a client navigation style remount", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [
        {
          crewId: 18,
          crewName: "금요일 스터디",
          description: "매주 금요일 저녁 추리에 서로의 깨달음을 남기는 독서 크루입니다.",
          visibility: "PRIVATE",
          leaderNickname: "힌트장인",
          coverImageUrl: null,
          myRole: "MEMBER",
          memberCount: 5,
        },
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(
      <StrictMode>
        <ProfileCrewsPage />
      </StrictMode>,
    );

    expect(await screen.findByRole("link", { name: /금요일 스터디/ })).toHaveAttribute(
      "href",
      "/crews/18",
    );
  });

  it("shows an empty state when no pending or active crews are returned", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileCrewsPage />);

    expect(await screen.findByText("아직 소속된 크루가 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공개 크루 탐색" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
  });

  it("keeps active crew results visible when pending crew loading fails", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockRejectedValue(new Error("pending failed"));
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [
        {
          crewId: 18,
          crewName: "금요일 스터디",
          description: "매주 금요일 저녁 추리에 서로의 깨달음을 남기는 독서 크루입니다.",
          visibility: "PRIVATE",
          leaderNickname: "힌트장인",
          coverImageUrl: null,
          myRole: "MEMBER",
          memberCount: 5,
        },
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileCrewsPage />);

    expect(await screen.findByRole("link", { name: /금요일 스터디/ })).toHaveAttribute(
      "href",
      "/crews/18",
    );
    expect(
      screen.getByText("일부 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByText("아직 소속된 크루가 없어요.")).not.toBeInTheDocument();
  });

  it("loads more active crews without duplicating existing cards", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getMyCrews)
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 17,
            crewName: "화요일 방팟",
            description: null,
            visibility: "PUBLIC",
            leaderNickname: "방탈매니아",
            coverImageUrl: null,
            myRole: "LEADER",
            memberCount: 3,
          },
        ],
        pageInfo: { page: 0, size: 20, hasNext: true },
      })
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 17,
            crewName: "화요일 방팟",
            description: null,
            visibility: "PUBLIC",
            leaderNickname: "방탈매니아",
            coverImageUrl: null,
            myRole: "LEADER",
            memberCount: 3,
          },
          {
            crewId: 18,
            crewName: "주말 하이킹",
            description: null,
            visibility: "PUBLIC",
            leaderNickname: "등산러",
            coverImageUrl: null,
            myRole: "MEMBER",
            memberCount: 2,
          },
        ],
        pageInfo: { page: 1, size: 20, hasNext: false },
      });

    render(<ProfileCrewsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "소속 크루 더 보기" }));

    expect(await screen.findByRole("link", { name: /주말 하이킹/ })).toHaveAttribute(
      "href",
      "/crews/18",
    );
    expect(screen.getAllByRole("link", { name: /화요일 방팟/ })).toHaveLength(1);
  });

  it("shows a retry affordance when the first load fails", async () => {
    mockFullUser();
    vi.mocked(getPendingCrews).mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getMyCrews).mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(<ProfileCrewsPage />);

    expect(
      await screen.findByText("소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("heading", { name: "내가 속한 크루" })).toBeInTheDocument();
  });
});
