import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
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

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    vi.mocked(logout).mockResolvedValue(undefined);
  });

  it("renders the frontend bootstrap heading", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "BangPot frontend bootstrap" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Public crews" })).toHaveAttribute(
      "href",
      "/crews/public",
    );

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    });
  });

  it("shows a profile entry only for full users", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(await screen.findByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("shows a crew leave success message after the redirect back home", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(await Home({ searchParams: Promise.resolve({ notice: "crew-left" }) }));

    expect(await screen.findByText("크루를 탈퇴했습니다.")).toBeInTheDocument();
  });
});
