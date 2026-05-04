import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewInvitesPage from "@/app/crews/[crewId]/invites/page";
import { getMe } from "@/shared/auth/client";
import { createCrewInvite, getCrewInviteCandidates } from "@/shared/crew/client";

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
  getPublicCrewJoinView: vi.fn(),
  createCrewJoinRequest: vi.fn(),
  getPendingCrewJoinRequests: vi.fn(),
  getCrewJoinRequests: vi.fn(),
  approveCrewJoinRequest: vi.fn(),
  rejectCrewJoinRequest: vi.fn(),
  getCrewInviteCandidates: vi.fn(),
  createCrewInvite: vi.fn(),
}));

describe("CrewInvitesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guest and completion-required users before loading invite candidates", async () => {
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
        redirectTo: "/crews/11/invites",
        requiredTermsVersion: "2026-03-25",
        user: { id: 7, nickname: null },
        requiredTermsAcceptedAt: null,
      });

    const guestPage = await CrewInvitesPage({ params: Promise.resolve({ crewId: "11" }) });
    render(guestPage);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Finvites");
    });

    cleanup();
    replaceMock.mockReset();

    const completionPage = await CrewInvitesPage({ params: Promise.resolve({ crewId: "11" }) });
    render(completionPage);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fcrews%2F11%2Finvites");
    });
    expect(getCrewInviteCandidates).not.toHaveBeenCalled();
  });

  it("loads candidates, allows selecting one user, and creates a pending invite", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "leader" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewInviteCandidates)
      .mockResolvedValueOnce([
        {
          userId: 12,
          nickname: "bangpot",
        },
        {
          userId: 13,
          nickname: "crewmate",
        },
      ])
      .mockResolvedValueOnce([
        {
          userId: 13,
          nickname: "crewmate",
        },
      ]);
    vi.mocked(createCrewInvite).mockResolvedValue({
      crewId: 11,
      targetUserId: 13,
      status: "PENDING",
    });

    render(await CrewInvitesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "직접 초대" })).toBeInTheDocument();
    expect(screen.getByLabelText("검색어")).toHaveValue("");
    expect(screen.getByText("bangpot")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("검색어"), {
      target: { value: "crew" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(getCrewInviteCandidates).toHaveBeenNthCalledWith(2, 11, "crew");
    });

    fireEvent.click(screen.getByLabelText("crewmate 선택"));
    fireEvent.click(screen.getByRole("button", { name: "초대 보내기" }));

    await waitFor(() => {
      expect(createCrewInvite).toHaveBeenCalledWith(11, 13);
    });

    expect(await screen.findByText("초대를 보냈습니다. 현재 상태는 PENDING입니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "초대 보냄" })).toBeDisabled();
  });

  it("shows backend access and duplicate invite errors without exposing management actions", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 2, nickname: "member" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewInviteCandidates).mockRejectedValueOnce(
      new OperationalError({
        code: "CREW_INVITE_NOT_ALLOWED",
        message: "공개 크루에서는 직접 초대를 보낼 수 없습니다.",
        requestId: "req-invite-not-allowed-1",
        status: 403,
      }),
    );

    render(await CrewInvitesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("공개 크루에서는 직접 초대를 보낼 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "초대 보내기" })).not.toBeInTheDocument();

    cleanup();
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "leader" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getCrewInviteCandidates).mockResolvedValue([
      {
        userId: 12,
        nickname: "bangpot",
      },
    ]);
    vi.mocked(createCrewInvite).mockRejectedValue(
      new OperationalError({
        code: "CREW_INVITE_ALREADY_PENDING",
        message: "이미 pending 초대가 있는 사용자입니다.",
        requestId: "req-invite-pending-1",
        status: 409,
      }),
    );

    render(await CrewInvitesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("bangpot")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("bangpot 선택"));
    fireEvent.click(screen.getByRole("button", { name: "초대 보내기" }));

    expect(await screen.findByText("이미 pending 초대가 있는 사용자입니다.")).toBeInTheDocument();
  });
});
