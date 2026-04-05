import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AuthCompletePage from "@/app/auth/complete/page";
import {
  checkNicknameAvailability,
  completeProfile,
  getMe,
} from "@/shared/auth/client";
import { OperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams("redirectTo=%2Fprotected-demo"),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  checkNicknameAvailability: vi.fn(),
  completeProfile: vi.fn(),
}));

vi.mock("@/shared/monitoring/operations", () => ({
  reportOperationalError: vi.fn(),
}));

describe("AuthCompletePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits nickname and required terms, then routes temp users to their pending destination", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/protected-demo",
      requiredTermsVersion: "2026-03-25",
      user: { id: 3, nickname: null },
      requiredTermsAcceptedAt: null,
    });
    vi.mocked(checkNicknameAvailability).mockResolvedValue({
      nickname: "potmaster",
      available: true,
    });
    vi.mocked(completeProfile).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      nextPath: "/protected-demo",
    });

    render(<AuthCompletePage />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "potmaster" } });

    await waitFor(() => {
      expect(checkNicknameAvailability).toHaveBeenCalledWith("potmaster");
    });

    fireEvent.click(screen.getByLabelText("필수 약관에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith({
        nickname: "potmaster",
        agreedToRequiredTerms: true,
      });
      expect(replaceMock).toHaveBeenCalledWith("/protected-demo");
    });
  });

  it("logs validation failures at warn level and shows the backend field error message", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/protected-demo",
      requiredTermsVersion: "2026-03-25",
      user: { id: 3, nickname: null },
      requiredTermsAcceptedAt: null,
    });
    vi.mocked(completeProfile).mockRejectedValue(
      new OperationalError({
        code: "COMMON_VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다.",
        requestId: "req-validation-1",
        status: 400,
        fieldErrors: [
          {
            field: "nickname",
            message: "닉네임은 비어 있을 수 없습니다.",
          },
        ],
      }),
    );

    render(<AuthCompletePage />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "   " } });
    fireEvent.click(screen.getByLabelText("필수 약관에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));

    expect(
      await screen.findByText("닉네임은 비어 있을 수 없습니다."),
    ).toBeInTheDocument();

    expect(reportOperationalError).toHaveBeenCalledWith(
      "auth.complete.submit_failed",
      expect.objectContaining({
        code: "COMMON_VALIDATION_ERROR",
      }),
      expect.objectContaining({
        level: "warn",
        route: "/auth/complete",
      }),
    );
  });

  it("logs duplicate nickname failures at warn level and places the message on the nickname field", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/protected-demo",
      requiredTermsVersion: "2026-03-25",
      user: { id: 3, nickname: null },
      requiredTermsAcceptedAt: null,
    });
    vi.mocked(completeProfile).mockRejectedValue(
      new OperationalError({
        code: "AUTH_DUPLICATE_NICKNAME",
        message: "이미 사용 중인 닉네임입니다.",
        requestId: "req-dup-1",
        status: 409,
        fieldErrors: [],
      }),
    );

    render(<AuthCompletePage />);

    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "potmaster" } });
    fireEvent.click(screen.getByLabelText("필수 약관에 동의합니다."));
    fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));

    expect(
      await screen.findByText("이미 사용 중인 닉네임입니다."),
    ).toBeInTheDocument();

    expect(reportOperationalError).toHaveBeenCalledWith(
      "auth.complete.submit_failed",
      expect.objectContaining({
        code: "AUTH_DUPLICATE_NICKNAME",
      }),
      expect.objectContaining({
        level: "warn",
        route: "/auth/complete",
      }),
    );
  });
});
