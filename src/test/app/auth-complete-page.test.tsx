import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthCompletePage from "@/app/auth/complete/page";
import {
  checkNicknameAvailability,
  completeProfile,
  getMe,
} from "@/shared/auth/client";

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

describe("AuthCompletePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
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

    fireEvent.click(screen.getByLabelText("필수 약관에 동의합니다"));
    fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith({
        nickname: "potmaster",
        agreedToRequiredTerms: true,
      });
      expect(replaceMock).toHaveBeenCalledWith("/protected-demo");
    });
  });
});
