import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FullUserAuthMenu } from "@/features/auth/components/FullUserAuthMenu";
import { getMe, logout } from "@/shared/auth/client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

describe("FullUserAuthMenu", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows profile and logout entries for a full user menu", () => {
    render(<FullUserAuthMenu route="/" />);

    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("reuses the existing logout contract and routes to login after guest confirmation", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<FullUserAuthMenu route="/" />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(getMe).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
