import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/profile/page";
import {
  getMe,
  getMyCalendar,
  getProfile,
  logout,
  updateProfile,
} from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getMyCalendar: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
}));

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "bangpot" },
    requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
  });
}

function mockProfile() {
  vi.mocked(getProfile).mockResolvedValue({
    id: 1,
    nickname: "bangpot",
    profileImageUrl: null,
    createdMeetingsCount: 3,
    joinedMeetingsCount: 4,
    myCrewsCount: 2,
    pendingCrewsCount: 1,
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users back to completion before loading the profile hub", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fprofile");
    });
    expect(getProfile).not.toHaveBeenCalled();
    expect(getMyCalendar).not.toHaveBeenCalled();
  });

  it("loads the profile hub and shows the calendar section with selectable schedules", async () => {
    mockFullUser();
    mockProfile();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [
        {
          meetingId: 71,
          meetingTitle: "금요일 방탈출",
          crewId: 3,
          crewName: "방탈출 크루",
          date: "2026-05-15",
          time: "19:00",
          meetingStatus: "RECRUITING",
          isCanceled: false,
          participationRole: "HOST",
        },
        {
          meetingId: 72,
          meetingTitle: "토요일 리벤지",
          crewId: 4,
          crewName: "서울 이스케이프",
          date: "2026-05-18",
          time: "14:00",
          meetingStatus: "CANCELED",
          isCanceled: true,
          participationRole: "PARTICIPANT",
        },
      ],
      totalCount: 2,
    });

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "내 프로필" })).toBeInTheDocument();
    expect(screen.getByText("프로필 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByText("bangpot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /생성 모임 3/ })).toHaveAttribute(
      "href",
      "/profile/created-meetings",
    );
    expect(screen.getByRole("link", { name: /참여 모임 4/ })).toHaveAttribute(
      "href",
      "/profile/joined-meetings",
    );
    expect(screen.getByRole("link", { name: /소속 크루 2/ })).toHaveAttribute(
      "href",
      "/profile/crews",
    );
    expect(screen.getByRole("link", { name: /가입 대기 중 크루 1/ })).toHaveAttribute(
      "href",
      "/profile/pending-crews",
    );
    expect(screen.getByRole("link", { name: "내 방탈로그" })).toHaveAttribute(
      "href",
      "/profile/logs",
    );
    expect(screen.getByRole("link", { name: "회원탈퇴" })).toHaveAttribute(
      "href",
      "/profile/withdrawal",
    );

    expect(screen.getByRole("heading", { name: "달력" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "15일" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "18일" })).toBeInTheDocument();
    expect(screen.getByText("금요일 방탈출")).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();
    expect(screen.getByText("모임장")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "18일" }));

    expect(screen.getByText("토요일 리벤지")).toBeInTheDocument();
    expect(screen.getByText("서울 이스케이프")).toBeInTheDocument();
    expect(screen.getByText("참여자")).toBeInTheDocument();
    expect(screen.getByText("취소")).toBeInTheDocument();
  });

  it("keeps the hub counts from get profile even when patch returns null counts", async () => {
    mockFullUser();
    mockProfile();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    vi.mocked(updateProfile).mockResolvedValue({
      id: 1,
      nickname: "potmaster",
      profileImageUrl: null,
      createdMeetingsCount: null,
      joinedMeetingsCount: null,
      myCrewsCount: null,
      pendingCrewsCount: null,
    });

    render(<ProfilePage />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "potmaster" } });
    fireEvent.click(screen.getByRole("button", { name: "닉네임 저장" }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        nickname: "potmaster",
      });
    });

    expect(screen.getByDisplayValue("potmaster")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /생성 모임 3/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /참여 모임 4/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /소속 크루 2/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /가입 대기 중 크루 1/ })).toBeInTheDocument();
  });

  it("shows the backend nickname validation message on profile update failure", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    mockFullUser();
    mockProfile();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    vi.mocked(updateProfile).mockRejectedValue(
      new OperationalError({
        code: "COMMON_VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다.",
        requestId: "req-profile-validation-1",
        status: 400,
        fieldErrors: [
          {
            field: "nickname",
            message: "닉네임이 비어 있을 수 없습니다.",
          },
        ],
      }),
    );

    render(<ProfilePage />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "닉네임 저장" }));

    expect(await screen.findByText("닉네임이 비어 있을 수 없습니다.")).toBeInTheDocument();
  });

  it("keeps the profile hub visible when the calendar section fails and allows retry", async () => {
    mockFullUser();
    mockProfile();
    vi.mocked(getMyCalendar)
      .mockRejectedValueOnce(new Error("calendar boom"))
      .mockResolvedValueOnce({
        items: [],
        totalCount: 0,
      });

    render(<ProfilePage />);

    expect(await screen.findByText("bangpot")).toBeInTheDocument();
    expect(
      await screen.findByText("달력 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getMyCalendar).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText("아직 표시할 일정이 없어요")).toBeInTheDocument();
  });

  it("logs out, re-checks auth state, and routes back to login when the user becomes guest", async () => {
    vi.mocked(getMe)
      .mockResolvedValueOnce({
        authStatus: "FULL",
        completionRequired: false,
        redirectTo: null,
        requiredTermsVersion: "2026-03-25",
        user: { id: 1, nickname: "bangpot" },
        requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
      })
      .mockResolvedValueOnce({
        authStatus: "GUEST",
        completionRequired: false,
        redirectTo: null,
        requiredTermsVersion: "2026-03-25",
        user: null,
        requiredTermsAcceptedAt: null,
      });
    mockProfile();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    vi.mocked(logout).mockResolvedValue(undefined);

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "내 프로필" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
