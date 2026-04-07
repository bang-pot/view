import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/profile/page";
import { getMe, getProfile, logout, updateProfile } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users back to completion before loading the profile", async () => {
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
  });

  it("loads the current profile and reflects the updated nickname after save", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getProfile).mockResolvedValue({
      id: 1,
      nickname: "bangpot",
    });
    vi.mocked(updateProfile).mockResolvedValue({
      id: 1,
      nickname: "potmaster",
    });

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("User ID: 1")).toBeInTheDocument();

    const nicknameInput = screen.getByLabelText("Nickname");
    fireEvent.change(nicknameInput, { target: { value: "potmaster" } });
    fireEvent.click(screen.getByRole("button", { name: "Save nickname" }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        nickname: "potmaster",
      });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("potmaster")).toBeInTheDocument();
      expect(screen.getByText("Current nickname: potmaster")).toBeInTheDocument();
    });
  });

  it("shows the backend nickname validation message on profile update failure", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getProfile).mockResolvedValue({
      id: 1,
      nickname: "bangpot",
    });
    vi.mocked(updateProfile).mockRejectedValue(
      new OperationalError({
        code: "COMMON_VALIDATION_ERROR",
        message: "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.",
        requestId: "req-profile-validation-1",
        status: 400,
        fieldErrors: [
          {
            field: "nickname",
            message: "?됰꽕?꾩? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.",
          },
        ],
      }),
    );

    render(<ProfilePage />);

    const nicknameInput = await screen.findByLabelText("Nickname");
    fireEvent.change(nicknameInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save nickname" }));

    expect(
      await screen.findByText("?됰꽕?꾩? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎."),
    ).toBeInTheDocument();
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
    vi.mocked(getProfile).mockResolvedValue({
      id: 1,
      nickname: "bangpot",
    });
    vi.mocked(logout).mockResolvedValue(undefined);

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
