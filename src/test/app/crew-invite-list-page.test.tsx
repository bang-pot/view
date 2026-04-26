import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewInviteListPage from "@/app/crew-invites/page";
import { getMe } from "@/shared/auth/client";
import {
  acceptCrewInvite,
  getMyCrewInvites,
  rejectCrewInvite,
} from "@/shared/crew/client";

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
  getCrewInviteCandidates: vi.fn(),
  createCrewInvite: vi.fn(),
  getMyCrewInvites: vi.fn(),
  acceptCrewInvite: vi.fn(),
  rejectCrewInvite: vi.fn(),
}));

describe("CrewInviteListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guest and completion-required users before loading invites", async () => {
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
        redirectTo: "/crew-invites",
        requiredTermsVersion: "2026-03-25",
        user: { id: 7, nickname: null },
        requiredTermsAcceptedAt: null,
      });

    render(<CrewInviteListPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrew-invites");
    });

    cleanup();
    replaceMock.mockReset();

    render(<CrewInviteListPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fcrew-invites");
    });
    expect(getMyCrewInvites).not.toHaveBeenCalled();
  });

  it("loads invites and updates pending items after accept and reject", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrewInvites).mockResolvedValue({
      items: [
        {
          inviteId: 101,
          crewId: 11,
          crewName: "Night runners",
          inviterNickname: "leader-one",
          status: "PENDING",
        },
        {
          inviteId: 202,
          crewId: 22,
          crewName: "Dawn birds",
          inviterNickname: "leader-two",
          status: "APPROVED",
        },
        {
          inviteId: 303,
          crewId: 33,
          crewName: "Moon walkers",
          inviterNickname: "leader-three",
          status: "PENDING",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(acceptCrewInvite).mockResolvedValue({
      inviteId: 101,
      crewId: 11,
      status: "APPROVED",
    });
    vi.mocked(rejectCrewInvite).mockResolvedValue({
      inviteId: 303,
      crewId: 33,
      status: "REJECTED",
    });

    render(<CrewInviteListPage />);

    expect(await screen.findByRole("heading", { name: "My invites" })).toBeInTheDocument();
    expect(getMyCrewInvites).toHaveBeenCalledWith({
      page: 0,
      size: 20,
    });
    expect(screen.getByText("Night runners")).toBeInTheDocument();
    expect(screen.getByText("Invited by: leader-one")).toBeInTheDocument();
    expect(screen.getAllByText("PENDING")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Accept invite 101" }));

    await waitFor(() => {
      expect(acceptCrewInvite).toHaveBeenCalledWith(101);
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Go to crew 11" })).toHaveAttribute(
        "href",
        "/crews/11",
      );
    });
    expect(screen.getAllByText("APPROVED")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Reject invite 303" }));

    await waitFor(() => {
      expect(rejectCrewInvite).toHaveBeenCalledWith(303);
    });

    expect(await screen.findByText("Invited by: leader-three")).toBeInTheDocument();
    expect(screen.getByText("REJECTED")).toBeInTheDocument();
  });

  it("shows a backend not-found error when an invite was already processed", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrewInvites).mockResolvedValue({
      items: [
        {
          inviteId: 101,
          crewId: 11,
          crewName: "Night runners",
          inviterNickname: "leader-one",
          status: "PENDING",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(acceptCrewInvite).mockRejectedValue(
      new OperationalError({
        code: "CREW_INVITE_NOT_FOUND",
        message: "이미 처리되었거나 존재하지 않는 초대입니다.",
        requestId: "req-invite-not-found-1",
        status: 404,
        fieldErrors: [],
      }),
    );

    render(<CrewInviteListPage />);

    expect(await screen.findByText("Night runners")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept invite 101" }));

    expect(
      await screen.findByText("이미 처리되었거나 존재하지 않는 초대입니다."),
    ).toBeInTheDocument();
  });
  it("loads the next invite page while keeping already loaded items", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getMyCrewInvites)
      .mockResolvedValueOnce({
        items: [
          {
            inviteId: 101,
            crewId: 11,
            crewName: "Night runners",
            inviterNickname: "leader-one",
            status: "PENDING",
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            inviteId: 202,
            crewId: 22,
            crewName: "Dawn birds",
            inviterNickname: "leader-two",
            status: "PENDING",
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<CrewInviteListPage />);

    expect(await screen.findByText("Night runners")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load more invites" }));

    expect(await screen.findByText("Dawn birds")).toBeInTheDocument();
    expect(screen.getByText("Night runners")).toBeInTheDocument();
    expect(getMyCrewInvites).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 20,
    });
  });
});
