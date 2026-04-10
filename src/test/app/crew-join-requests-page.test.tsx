import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewJoinRequestsPage from "@/app/crews/[crewId]/join-requests/page";
import {
  approveCrewJoinRequest,
  getCrewJoinRequests,
  rejectCrewJoinRequest,
} from "@/shared/crew/client";
import { getMe } from "@/shared/auth/client";

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

vi.mock("@/shared/crew/client", () => ({
  createCrew: vi.fn(),
  getPublicCrews: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  createCrewJoinRequest: vi.fn(),
  getPendingCrewJoinRequests: vi.fn(),
  getCrewJoinRequests: vi.fn(),
  approveCrewJoinRequest: vi.fn(),
  rejectCrewJoinRequest: vi.fn(),
}));

describe("CrewJoinRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guest and completion-required users before loading the management list", async () => {
    vi.mocked(getMe)
      .mockResolvedValueOnce({
        authStatus: "GUEST",
        completionRequired: false,
        redirectTo: null,
        requiredTermsVersion: "2026-03-25",
        user: null,
        requiredTermsAcceptedAt: null,
      })
      .mockResolvedValueOnce({
        authStatus: "TEMP",
        completionRequired: true,
        redirectTo: "/crews/11/join-requests",
        requiredTermsVersion: "2026-03-25",
        user: { id: 7, nickname: null },
        requiredTermsAcceptedAt: null,
      });

    const guestPage = await CrewJoinRequestsPage({ params: Promise.resolve({ crewId: "11" }) });
    render(guestPage);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Fjoin-requests");
    });

    cleanup();
    replaceMock.mockReset();

    const completionPage = await CrewJoinRequestsPage({ params: Promise.resolve({ crewId: "11" }) });
    render(completionPage);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fcrews%2F11%2Fjoin-requests",
      );
    });
    expect(getCrewJoinRequests).not.toHaveBeenCalled();
  });

  it("shows the full join request list and updates item status after approve and reject", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "leader" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewJoinRequests).mockResolvedValue([
      {
        requestId: 91,
        userId: 7,
        nickname: "runner7",
        message: "Please let me join.",
        status: "PENDING",
      },
      {
        requestId: 92,
        userId: 8,
        nickname: "runner8",
        message: null,
        status: "APPROVED",
      },
    ]);
    vi.mocked(approveCrewJoinRequest).mockResolvedValue({
      crewId: 11,
      requestId: 91,
      userId: 7,
      role: "MEMBER",
    });
    vi.mocked(rejectCrewJoinRequest).mockResolvedValue({
      crewId: 11,
      requestId: 91,
    });

    render(await CrewJoinRequestsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "가입 신청 관리" })).toBeInTheDocument();
    expect(screen.getByText("runner7")).toBeInTheDocument();
    expect(screen.getByText("Please let me join.")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "승인" }));

    await waitFor(() => {
      expect(approveCrewJoinRequest).toHaveBeenCalledWith(11, 91);
      expect(screen.getAllByText("APPROVED")).toHaveLength(2);
    });

    cleanup();
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "leader" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewJoinRequests).mockResolvedValue([
      {
        requestId: 93,
        userId: 9,
        nickname: "runner9",
        message: "I can help with events.",
        status: "PENDING",
      },
    ]);

    render(await CrewJoinRequestsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("runner9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "거절" }));

    await waitFor(() => {
      expect(rejectCrewJoinRequest).toHaveBeenCalledWith(11, 93);
      expect(screen.getByText("REJECTED")).toBeInTheDocument();
    });
  });

  it("shows an access denied message for full users who are not crew leaders", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 2, nickname: "member" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewJoinRequests).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-join-403",
        status: 403,
      }),
    );

    render(await CrewJoinRequestsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("접근 권한이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "승인" })).not.toBeInTheDocument();
  });
});
