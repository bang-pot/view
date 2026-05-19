import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMembersPage from "@/app/crews/[crewId]/members/page";
import { getMe } from "@/shared/auth/client";
import { getCrewMembers } from "@/shared/crew/client";

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
  transferCrewLeadership: vi.fn(),
  removeCrewMember: vi.fn(),
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

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

describe("CrewMembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        private readonly callback: IntersectionObserverCallback;

        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }

        observe(element: Element) {
          this.callback(
            [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }

        disconnect() {}

        unobserve() {}

        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      },
    );
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 11, nickname: "leader-one" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the crew member directory with profile, role, intro, escape count, and joined date", async () => {
    vi.mocked(getCrewMembers).mockResolvedValue({
      items: [
        {
          userId: 11,
          nickname: "leader-one",
          profileImageUrl: null,
          bio: "방탈 입문자도 같이 데려가는 서울 탈출러",
          gender: "MALE",
          escapeCount: 87,
          role: "LEADER",
          joinedAt: "2026-04-08T00:00:00Z",
        },
        {
          userId: 33,
          nickname: "member-three",
          profileImageUrl: "https://example.com/member-three.png",
          bio: "무서운 테마보다 추리 테마를 좋아해요",
          gender: "FEMALE",
          escapeCount: 64,
          role: "MEMBER",
          joinedAt: "2026-04-10T00:00:00Z",
        },
        {
          userId: 22,
          nickname: "member-two",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 0,
          role: "MEMBER",
          joinedAt: "2026-04-09T00:00:00Z",
        },
      ],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "크루원" })).toBeInTheDocument();
    expect(screen.getByText("총 3명")).toBeInTheDocument();

    const items = within(screen.getByRole("list", { name: "크루원 목록" })).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute("data-member-role", "LEADER");
    expect(items[1]).toHaveAttribute("data-member-role", "MEMBER");
    expect(within(items[0]).getByText("leader-one")).toBeInTheDocument();
    expect(within(items[1]).getByText("member-three")).toBeInTheDocument();
    expect(within(items[2]).getByText("member-two")).toBeInTheDocument();

    expect(within(items[0]).getByText("크루장")).toBeInTheDocument();
    expect(within(items[0]).getByText("방탈 입문자도 같이 데려가는 서울 탈출러")).toBeInTheDocument();
    expect(within(items[0]).getByText("남 · 87방")).toBeInTheDocument();
    expect(within(items[0]).getByText("2026.04.08 가입")).toBeInTheDocument();
    expect(within(items[0]).getByLabelText("leader-one 기본 프로필 이미지")).toBeInTheDocument();

    expect(within(items[1]).getByText("여 · 64방")).toBeInTheDocument();
    expect(within(items[1]).getByAltText("member-three 프로필 이미지")).toHaveAttribute(
      "src",
      expect.stringContaining(encodeURIComponent("https://example.com/member-three.png")),
    );

    expect(within(items[2]).getByText("크루원")).toBeInTheDocument();
    expect(within(items[2]).getByText("한 줄 소개가 아직 없습니다.")).toBeInTheDocument();
    expect(within(items[2]).getByText("미설정 · 0방")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /위임|퇴출/ })).not.toBeInTheDocument();
    expect(getCrewMembers).toHaveBeenCalledWith(11, { page: 0, size: 20 });
  });

  it("appends the next page when the member list has another page", async () => {
    vi.mocked(getCrewMembers)
      .mockResolvedValueOnce({
        items: [
          {
            userId: 11,
            nickname: "leader-one",
            profileImageUrl: null,
            bio: null,
            gender: null,
            escapeCount: 87,
            role: "LEADER",
            joinedAt: "2026-04-08T00:00:00Z",
          },
        ],
        pageInfo: { page: 0, size: 20, hasNext: true },
      })
      .mockResolvedValueOnce({
        items: [
          {
            userId: 22,
            nickname: "member-two",
            profileImageUrl: null,
            bio: null,
            gender: null,
            escapeCount: 12,
            role: "MEMBER",
            joinedAt: "2026-04-09T00:00:00Z",
          },
        ],
        pageInfo: { page: 1, size: 20, hasNext: false },
      });

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("leader-one")).toBeInTheDocument();
    await waitFor(() => {
      expect(getCrewMembers).toHaveBeenCalledWith(11, { page: 1, size: 20 });
    });
    expect(await screen.findByText("member-two")).toBeInTheDocument();
    expect(screen.getByText("총 2명")).toBeInTheDocument();
  });

  it("shows empty and load failure states without crashing", async () => {
    vi.mocked(getCrewMembers).mockResolvedValueOnce({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByText("아직 표시할 크루원이 없습니다.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getCrewMembers).mockRejectedValueOnce(new Error("boom"));

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(
      await screen.findByText("크루원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("redirects non-members back to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getCrewMembers).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-members-1",
        status: 403,
      }),
    );

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
