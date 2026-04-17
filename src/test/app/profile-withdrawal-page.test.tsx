import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileWithdrawalPage from "@/app/profile/withdrawal/page";
import { getMe, getWithdrawalCheck } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getWithdrawalCheck: vi.fn(),
}));

describe("ProfileWithdrawalPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the withdrawal check", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/withdrawal",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfileWithdrawalPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprofile%2Fwithdrawal",
      );
    });
    expect(getWithdrawalCheck).not.toHaveBeenCalled();
  });

  it("renders the impact guidance and next-step affordance when withdrawal is allowed", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getWithdrawalCheck).mockResolvedValue({
      canWithdraw: true,
      blockingActiveCrews: [],
      blockingParticipatingMeetings: [],
    });

    render(<ProfileWithdrawalPage />);

    expect(await screen.findByRole("heading", { name: "삭제되는 것" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "유지되는 것" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "재가입 가능 여부" })).toBeInTheDocument();
    expect(screen.getByText("지금은 회원탈퇴 다음 단계로 진행할 수 있어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 단계로" })).toBeDisabled();
  });

  it("renders every blocking reason at once when withdrawal is not allowed", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getWithdrawalCheck).mockResolvedValue({
      canWithdraw: false,
      blockingActiveCrews: [
        {
          crewId: 17,
          crewName: "방탈출 크루",
        },
      ],
      blockingParticipatingMeetings: [
        {
          meetingId: 51,
          meetingTitle: "금요 방탈출",
          crewId: 17,
          crewName: "방탈출 크루",
          meetingStatus: "RECRUITING",
          date: "2026-04-20",
          time: "19:00",
          participationRole: "HOST",
        },
        {
          meetingId: 52,
          meetingTitle: "토요 방탈출",
          crewId: 18,
          crewName: "미궁 크루",
          meetingStatus: "RECRUITMENT_CLOSED",
          date: "2026-04-21",
          time: "14:00",
          participationRole: "PARTICIPANT",
        },
      ],
    });

    render(<ProfileWithdrawalPage />);

    expect(
      await screen.findByText("회원탈퇴 전에 활성 크루와 진행 중인 모임 관계를 먼저 정리해야 해요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정리해야 하는 크루" })).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정리해야 하는 모임" })).toBeInTheDocument();
    expect(screen.getByText("금요 방탈출")).toBeInTheDocument();
    expect(screen.getByText("토요 방탈출")).toBeInTheDocument();
    expect(screen.getByText(/방탈출 크루 · 모집 중 · 모임장/)).toBeInTheDocument();
    expect(screen.getByText(/미궁 크루 · 모집 마감 · 참여자/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다음 단계로" })).not.toBeInTheDocument();
  });

  it("shows an error with retry when the first withdrawal-check load fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getWithdrawalCheck)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        canWithdraw: true,
        blockingActiveCrews: [],
        blockingParticipatingMeetings: [],
      });

    render(<ProfileWithdrawalPage />);

    expect(
      await screen.findByText("회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("button", { name: "다음 단계로" })).toBeInTheDocument();
  });
});
