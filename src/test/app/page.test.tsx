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

  it("renders the public home entry in Korean and hides the internal demo link", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "BangPot" })).toBeInTheDocument();
    expect(
      screen.getByText("방탈출 크루를 찾고, 모임을 만들고, 함께 기록해 보세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "탐색하기" })).toHaveAttribute("href", "/explore");
    expect(screen.getByRole("link", { name: "공개 크루 둘러보기" })).toHaveAttribute(
      "href",
      "/crews/public",
    );
    expect(screen.queryByRole("link", { name: "Protected demo" })).not.toBeInTheDocument();

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

  it("shows a crew delete success message after the redirect back home", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(await Home({ searchParams: Promise.resolve({ notice: "crew-deleted" }) }));

    expect(await screen.findByText("크루를 삭제했습니다.")).toBeInTheDocument();
  });
});
