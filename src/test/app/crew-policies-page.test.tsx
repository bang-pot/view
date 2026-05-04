import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewPoliciesPage from "@/app/crews/[crewId]/policies/page";
import { getCrewHub, getCrewPolicies } from "@/shared/crew/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/crew/client", () => ({
  createCrew: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  getCrewHub: vi.fn(),
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

describe("CrewPoliciesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders accordion policy cards for joined crew members", async () => {
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
    vi.mocked(getCrewPolicies).mockResolvedValue([
      {
        policyId: 101,
        title: "모임 규칙",
        content: "지각 금지\n노쇼 금지",
      },
      {
        policyId: 102,
        title: "참여 기준",
        content: "불참 시 미리 알려주세요.",
      },
    ]);

    render(await CrewPoliciesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "정책" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "크루 허브로 돌아가기" })).toHaveAttribute(
      "href",
      "/crews/11",
    );

    const items = within(screen.getByRole("list", { name: "정책 목록" })).getAllByRole("listitem");
    expect(within(items[0]).getByRole("button", { name: "모임 규칙" })).toBeInTheDocument();
    expect(within(items[0]).queryByText("지각 금지")).not.toBeInTheDocument();

    fireEvent.click(within(items[0]).getByRole("button", { name: "모임 규칙" }));

    expect(within(items[0]).getByText("지각 금지")).toBeInTheDocument();
    expect(within(items[0]).getByText("노쇼 금지")).toBeInTheDocument();

    fireEvent.click(within(items[0]).getByRole("button", { name: "모임 규칙" }));

    expect(within(items[0]).queryByText("지각 금지")).not.toBeInTheDocument();
  });

  it("shows a leader-only empty-state CTA when there are no policies", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "LEADER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });
    vi.mocked(getCrewPolicies).mockResolvedValue([]);

    render(await CrewPoliciesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("자유로운 분위기로 운영되고 있네요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정책 추가하러 가기" })).toBeDisabled();
  });

  it("keeps the empty state read-only for normal crew members", async () => {
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
    vi.mocked(getCrewPolicies).mockResolvedValue([]);

    render(await CrewPoliciesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("자유로운 분위기로 운영되고 있네요")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "정책 추가하러 가기" })).not.toBeInTheDocument();
  });

  it("shows a safe failure state and redirects non-members to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

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
    vi.mocked(getCrewPolicies).mockRejectedValueOnce(new Error("boom"));

    render(await CrewPoliciesPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(
      await screen.findByText("크루 정책을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

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
    vi.mocked(getCrewPolicies).mockRejectedValueOnce(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-policies-1",
        status: 403,
      }),
    );

    render(await CrewPoliciesPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
