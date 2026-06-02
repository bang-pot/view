import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileCrewsPage from "@/app/profile/crews/page";
import { getMe, getMyCrews } from "@/shared/auth/client";

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
}));

describe("ProfileCrewsPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the crews list", async () => {
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
  });

  it("renders active crew cards and links them to the existing crew pages", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [
        {
          crewId: 17,
          crewName: "방탈출 크루",
          visibility: "PUBLIC",
          leaderNickname: "banglog",
          coverImageUrl: "https://example.com/crew-cover.jpg",
        },
        {
          crewId: 18,
          crewName: "심야 크루",
          visibility: "PRIVATE",
          leaderNickname: "nightpot",
          coverImageUrl: null,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<ProfileCrewsPage />);

    expect(await screen.findByRole("heading", { name: "소속 크루" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /방탈출 크루/ })).toHaveAttribute(
      "href",
      "/crews/17",
    );
    expect(screen.getByRole("link", { name: /심야 크루/ })).toHaveAttribute("href", "/crews/18");
    expect(screen.getByText("공개")).toBeInTheDocument();
    expect(screen.getByText("비공개")).toBeInTheDocument();
    expect(screen.getByText("크루장 banglog")).toBeInTheDocument();
    expect(screen.getByText("크루장 nightpot")).toBeInTheDocument();
    expect(screen.getByAltText("방탈출 크루 대표 이미지")).toHaveAttribute(
      "src",
      "https://example.com/crew-cover.jpg",
    );
    expect(screen.getByText("크루 이미지 준비 중")).toBeInTheDocument();
  });

  it("shows an empty state with a public crews CTA when no active crews are returned", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrews).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<ProfileCrewsPage />);

    expect(await screen.findByText("아직 소속된 크루가 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공개 크루 탐색" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
  });

  it("loads the next page with 더 보기 and keeps existing cards merged", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrews)
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 17,
            crewName: "방탈출 크루",
            visibility: "PUBLIC",
            leaderNickname: "banglog",
            coverImageUrl: null,
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
            crewId: 17,
            crewName: "방탈출 크루",
            visibility: "PUBLIC",
            leaderNickname: "banglog",
            coverImageUrl: null,
          },
          {
            crewId: 18,
            crewName: "심야 크루",
            visibility: "PRIVATE",
            leaderNickname: "nightpot",
            coverImageUrl: null,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<ProfileCrewsPage />);

    const loadMoreButton = await screen.findByRole("button", { name: "더 보기" });
    fireEvent.click(loadMoreButton);

    expect(await screen.findByRole("link", { name: /심야 크루/ })).toHaveAttribute(
      "href",
      "/crews/18",
    );
    expect(screen.getAllByRole("link", { name: /방탈출 크루/ })).toHaveLength(1);
  });

  it("keeps already loaded cards visible when 더 보기 fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrews)
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 17,
            crewName: "방탈출 크루",
            visibility: "PUBLIC",
            leaderNickname: "banglog",
            coverImageUrl: null,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockRejectedValueOnce(new Error("boom"));

    render(<ProfileCrewsPage />);

    const loadMoreButton = await screen.findByRole("button", { name: "더 보기" });
    fireEvent.click(loadMoreButton);

    expect(
      await screen.findByText("소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /방탈출 크루/ })).toBeInTheDocument();
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
    vi.mocked(getMyCrews)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 17,
            crewName: "방탈출 크루",
            visibility: "PUBLIC",
            leaderNickname: "banglog",
            coverImageUrl: null,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<ProfileCrewsPage />);

    expect(
      await screen.findByText("소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("link", { name: /방탈출 크루/ })).toBeInTheDocument();
  });
});
