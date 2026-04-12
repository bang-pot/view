import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewSettingsPage from "@/app/crews/[crewId]/settings/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub, updateCrewVisibility } from "@/shared/crew/client";

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
  getCrewHub: vi.fn(),
  updateCrewVisibility: vi.fn(),
  getCrewMembers: vi.fn(),
  getCrewPolicies: vi.fn(),
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

describe("CrewSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a leader-only visibility toggle with the current meaning guide", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "leader-one" },
      requiredTermsAcceptedAt: "2026-03-25T00:00:00Z",
    });
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PUBLIC",
      imageUrl: null,
      myRole: "LEADER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });
    vi.mocked(updateCrewVisibility).mockResolvedValue({
      crewId: 11,
      visibility: "PRIVATE",
    });

    render(await CrewSettingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "크루 설정" })).toBeInTheDocument();
    expect(screen.getByText("현재 공개 상태: PUBLIC")).toBeInTheDocument();
    expect(
      screen.getByText("공개: 탐색에 노출되고 직접 가입 신청을 받을 수 있어요"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("비공개: 탐색에 노출되지 않고 직접 가입 신청을 받을 수 없어요"),
    ).toBeInTheDocument();

    const toggle = screen.getByRole("switch", { name: "공개 크루 여부" });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(updateCrewVisibility).toHaveBeenCalledWith(11, "PRIVATE");
    });
    expect(await screen.findByText("현재 공개 상태: PRIVATE")).toBeInTheDocument();
  });

  it("blocks normal members from changing the visibility", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 2, nickname: "member-one" },
      requiredTermsAcceptedAt: "2026-03-25T00:00:00Z",
    });
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "MEMBER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });

    render(await CrewSettingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("크루장만 공개 범위를 변경할 수 있습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "공개 크루 여부" })).not.toBeInTheDocument();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 3, nickname: "outsider" },
      requiredTermsAcceptedAt: "2026-03-25T00:00:00Z",
    });
    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-settings-1",
        status: 403,
      }),
    );

    render(await CrewSettingsPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
