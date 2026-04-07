import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedDemoPage from "@/app/protected-demo/page";
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

describe("ProtectedDemoPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
    vi.mocked(logout).mockResolvedValue(undefined);
  });

  it("redirects guests to login with the original destination", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<ProtectedDemoPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fprotected-demo");
    });
  });

  it("renders the protected page for full users", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(<ProtectedDemoPage />);

    expect(await screen.findByRole("heading", { name: "Protected Demo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
