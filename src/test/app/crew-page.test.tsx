import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewPage from "@/app/crews/[crewId]/page";
import { getCrewHub } from "@/shared/crew/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
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

describe("CrewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the internal crew hub shell for leaders", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "Night runners",
      description: "Private crew for late runners",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "LEADER",
      hasNotice: true,
      pendingJoinRequestCount: 2,
    });

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "Night runners" })).toBeInTheDocument();
    expect(screen.getByText("Crew ID: 11")).toBeInTheDocument();
    expect(screen.getByText("내 역할: LEADER")).toBeInTheDocument();
    expect(screen.getByText("공개 범위: PRIVATE")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "크루 네비게이션" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/crews/11");
    expect(screen.getByRole("link", { name: "정책" })).toHaveAttribute("href", "/crews/11/policies");
    expect(screen.getByRole("link", { name: "크루원" })).toHaveAttribute("href", "/crews/11/members");
    expect(screen.getByRole("link", { name: "설정" })).toHaveAttribute("href", "/crews/11/settings");
    expect(screen.getByText("공지사항이 등록되어 있습니다.")).toBeInTheDocument();
    expect(screen.getByText("가입 신청 대기: 2건")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "가입 신청 관리" })).toHaveAttribute(
      "href",
      "/crews/11/join-requests",
    );
    expect(screen.getByRole("heading", { name: "본문 캔버스" })).toBeInTheDocument();
  });

  it("hides leader-only guidance for normal crew members", async () => {
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

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "Night runners" })).toBeInTheDocument();
    expect(screen.getByText("내 역할: MEMBER")).toBeInTheDocument();
    expect(screen.queryByText("공지사항이 등록되어 있습니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("가입 신청 대기: 0건")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "가입 신청 관리" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "설정" })).not.toBeInTheDocument();
    expect(screen.getByText("이 크루의 공통 안내를 준비 중입니다.")).toBeInTheDocument();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-hub-1",
        status: 403,
      }),
    );

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
