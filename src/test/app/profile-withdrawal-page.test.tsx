import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileWithdrawalPage from "@/app/profile/withdrawal/page";
import { getMe, getWithdrawalCheck, withdrawUser } from "@/shared/auth/client";
import { OperationalError } from "@/shared/errors/operational";

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
  withdrawUser: vi.fn(),
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

  it("renders the execution step when withdrawal is allowed", async () => {
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
    });

    render(<ProfileWithdrawalPage />);

    expect(await screen.findByRole("heading", { name: "지금은 괜찮아요" })).toBeInTheDocument();
    expect(screen.getByText("지금은 회원탈퇴 다음 단계로 진행할 수 있어요.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음 단계로" }));

    expect(await screen.findByRole("heading", { name: "탈퇴 사유 선택" })).toBeInTheDocument();
    expect(screen.getByLabelText("더 이상 사용하지 않아요")).toBeInTheDocument();
    expect(screen.getByLabelText("서비스가 아쉬워요")).toBeInTheDocument();
    expect(screen.getByLabelText("활동이 줄었어요")).toBeInTheDocument();
    expect(screen.getByLabelText("기타")).toBeInTheDocument();
  });

  it("shows the optional detail input when OTHER is selected", async () => {
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
    });

    render(<ProfileWithdrawalPage />);

    fireEvent.click(await screen.findByRole("button", { name: "다음 단계로" }));
    fireEvent.click(screen.getByLabelText("기타"));

    expect(await screen.findByLabelText("상세 사유 (선택)")).toBeInTheDocument();
  });

  it("posts the withdrawal request and shows the completion state on success", async () => {
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
    });
    vi.mocked(withdrawUser).mockResolvedValue({
      withdrawnAt: "2026-04-19T10:00:00Z",
      canLogin: false,
    });

    render(<ProfileWithdrawalPage />);

    fireEvent.click(await screen.findByRole("button", { name: "다음 단계로" }));
    fireEvent.click(screen.getByLabelText("서비스가 아쉬워요"));
    fireEvent.click(screen.getByLabelText("안내된 내용을 모두 확인했어요"));
    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));

    await waitFor(() => {
      expect(withdrawUser).toHaveBeenCalledWith({
        reasonCode: "SERVICE_UNSATISFIED",
        reasonDetail: null,
        confirmationChecked: true,
      });
    });

    expect(await screen.findByText("회원탈퇴가 완료되었어요.")).toBeInTheDocument();
    expect(screen.getByText("재가입은 가능하지만 기존 데이터는 복구되지 않아요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인 화면으로" })).toBeInTheDocument();
  });

  it("prevents duplicate submissions while the withdrawal request is running", async () => {
    let resolveWithdrawal: ((value: { withdrawnAt: string; canLogin: false }) => void) | null = null;

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
    });
    vi.mocked(withdrawUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWithdrawal = resolve;
        }),
    );

    render(<ProfileWithdrawalPage />);

    fireEvent.click(await screen.findByRole("button", { name: "다음 단계로" }));
    fireEvent.click(screen.getByLabelText("더 이상 사용하지 않아요"));
    fireEvent.click(screen.getByLabelText("안내된 내용을 모두 확인했어요"));

    const submitButton = screen.getByRole("button", { name: "회원탈퇴" });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(withdrawUser).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "처리 중..." })).toBeDisabled();

    resolveWithdrawal?.({
      withdrawnAt: "2026-04-19T10:00:00Z",
      canLogin: false,
    });

    expect(await screen.findByText("회원탈퇴가 완료되었어요.")).toBeInTheDocument();
  });

  it("returns to the latest blocking state when the server rejects withdrawal with 409", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getWithdrawalCheck)
      .mockResolvedValueOnce({
        canWithdraw: true,
        blockingActiveCrews: [],
      })
      .mockResolvedValueOnce({
        canWithdraw: false,
        blockingActiveCrews: [
          {
            crewId: 17,
            crewName: "방탈출 크루",
          },
        ],
      });
    vi.mocked(withdrawUser).mockRejectedValue(
      new OperationalError({
        code: "AUTH_WITHDRAWAL_NOT_ALLOWED",
        message: "회원탈퇴가 불가능합니다.",
        userMessage: "회원탈퇴 전에 정리해야 하는 관계가 생겼어요. 최신 상태를 다시 확인해 주세요.",
        status: 409,
      }),
    );

    render(<ProfileWithdrawalPage />);

    fireEvent.click(await screen.findByRole("button", { name: "다음 단계로" }));
    fireEvent.click(screen.getByLabelText("활동이 줄었어요"));
    fireEvent.click(screen.getByLabelText("안내된 내용을 모두 확인했어요"));
    fireEvent.click(screen.getByRole("button", { name: "회원탈퇴" }));

    expect(
      await screen.findByText("회원탈퇴 전에 정리해야 하는 관계가 생겼어요. 최신 상태를 다시 확인해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정리해야 하는 크루" })).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "정리해야 하는 모임" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "탈퇴 사유 선택" })).not.toBeInTheDocument();
    expect(getWithdrawalCheck).toHaveBeenCalledTimes(2);
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
      });

    render(<ProfileWithdrawalPage />);

    expect(
      await screen.findByText("회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("button", { name: "다음 단계로" })).toBeInTheDocument();
  });
});
