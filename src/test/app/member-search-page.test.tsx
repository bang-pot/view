import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MemberSearchPage from "@/app/member-search/page";
import { getMe, searchUsers } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/auth/client")>(
    "@/shared/auth/client",
  );

  return {
    ...actual,
    getMe: vi.fn(),
    searchUsers: vi.fn(),
  };
});

describe("MemberSearchPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guests to login before opening the member search screen", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<MemberSearchPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fmember-search");
    });
    expect(searchUsers).not.toHaveBeenCalled();
  });

  it("redirects completion-required users before opening the member search screen", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/member-search",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<MemberSearchPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fmember-search");
    });
    expect(searchUsers).not.toHaveBeenCalled();
  });

  it("keeps the empty-keyword guidance visible until a nickname search is submitted", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(<MemberSearchPage />);

    expect(await screen.findByLabelText("닉네임 검색")).toBeInTheDocument();
    expect(screen.getByText("닉네임으로 회원을 검색해보세요")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("닉네임 검색"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(searchUsers).not.toHaveBeenCalled();
    expect(screen.getByText("닉네임으로 회원을 검색해보세요")).toBeInTheDocument();
  });

  it("renders matching users with profile details and lets the user select one result", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(searchUsers).mockResolvedValue({
      items: [
        {
          userId: 101,
          nickname: "bangpot",
          profileImageUrl: null,
          bio: "탈출 기록을 차곡차곡 모으는 중",
          gender: "FEMALE",
          escapeCount: 0,
        },
        {
          userId: 102,
          nickname: "bangpot",
          profileImageUrl: "https://cdn.example.com/users/102.jpg",
          bio: null,
          gender: null,
          escapeCount: 17,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    });

    render(<MemberSearchPage />);

    fireEvent.change(await screen.findByLabelText("닉네임 검색"), {
      target: { value: "bang" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(searchUsers).toHaveBeenCalledWith({
      keyword: "bang",
      page: 0,
      size: 20,
    });

    const results = await screen.findByRole("list", { name: "회원 검색 결과" });
    const rows = within(results).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(screen.getByText("기본 프로필 이미지")).toBeInTheDocument();
    expect(screen.getByText("탈출 기록을 차곡차곡 모으는 중")).toBeInTheDocument();
    expect(screen.getByText("성별 여성")).toBeInTheDocument();
    expect(screen.getByText("방수 0회")).toBeInTheDocument();
    expect(screen.getByText("한줄소개가 아직 없어요")).toBeInTheDocument();
    expect(screen.getByText("성별 미설정")).toBeInTheDocument();
    expect(screen.getByText("방수 17회")).toBeInTheDocument();

    fireEvent.click(within(rows[1]).getByRole("button", { name: "bangpot 선택" }));

    expect(await screen.findByText("선택한 회원 bangpot")).toBeInTheDocument();
    expect(within(rows[1]).getByText("선택됨")).toBeInTheDocument();
  });

  it("renders an empty-result message after a nickname search returns no users", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(searchUsers).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      },
    });

    render(<MemberSearchPage />);

    fireEvent.change(await screen.findByLabelText("닉네임 검색"), {
      target: { value: "nobody" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(await screen.findByText("검색 결과가 없어요")).toBeInTheDocument();
  });

  it("shows a retry affordance when loading the member search results fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(searchUsers)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            userId: 101,
            nickname: "bangpot",
            profileImageUrl: null,
            bio: null,
            gender: null,
            escapeCount: 0,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      });

    render(<MemberSearchPage />);

    fireEvent.change(await screen.findByLabelText("닉네임 검색"), {
      target: { value: "bang" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(
      await screen.findByText("회원 검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("bangpot")).toBeInTheDocument();
  });
});
