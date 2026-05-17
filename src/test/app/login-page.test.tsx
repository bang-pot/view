import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { buildKakaoLoginUrl, getMe } from "@/shared/auth/client";

const replaceMock = vi.fn();
let searchParamsMock = new URLSearchParams("redirectTo=%2Fprotected-demo");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  buildKakaoLoginUrl: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    searchParamsMock = new URLSearchParams("redirectTo=%2Fprotected-demo");
    vi.mocked(buildKakaoLoginUrl).mockReturnValue(
      "http://localhost:8080/oauth2/authorization/kakao?redirectTo=%2Fprotected-demo",
    );
  });

  it("redirects temp users back to completion instead of home", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/protected-demo",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprotected-demo",
      );
    });
  });

  it("redirects full users to the original target when they revisit login", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/protected-demo");
    });
  });

  it("renders the kakao login entry for guests as a full document navigation", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<LoginPage />);

    const loginLink = await screen.findByRole("link", { name: "카카오로 시작하기" });

    expect(loginLink).toHaveAttribute(
      "href",
      "http://localhost:8080/oauth2/authorization/kakao?redirectTo=%2Fprotected-demo",
    );
    expect(loginLink).toHaveAttribute("target", "_self");
    expect(loginLink).toHaveAttribute("rel", "external");
  });

  it("shows a retry-friendly error when oauth login fails and returns to login", async () => {
    searchParamsMock = new URLSearchParams("error=oauth_failed");
    vi.mocked(buildKakaoLoginUrl).mockReturnValue(
      "http://localhost:8080/oauth2/authorization/kakao?redirectTo=%2F",
    );
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<LoginPage />);

    expect(
      await screen.findByText("카카오 로그인에 실패했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });
});
