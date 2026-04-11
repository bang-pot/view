import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMembersPage from "@/app/crews/[crewId]/members/page";
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
  getPublicCrews: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  getCrewHub: vi.fn(),
  getCrewMembers: vi.fn(),
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

describe("CrewMembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a read-only crew member list with leader-first ordering and avatar fallbacks", async () => {
    vi.mocked(getCrewMembers).mockResolvedValue([
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
      {
        userId: 11,
        nickname: "leader-one",
        profileImageUrl: null,
        bio: null,
        gender: null,
        escapeCount: 0,
        role: "LEADER",
        joinedAt: "2026-04-08T00:00:00Z",
      },
      {
        userId: 33,
        nickname: "member-three",
        profileImageUrl: "https://example.com/member-three.png",
        bio: "새벽 러닝 좋아해요",
        gender: "FEMALE",
        escapeCount: 1,
        role: "MEMBER",
        joinedAt: "2026-04-10T00:00:00Z",
      },
    ]);

    render(await CrewMembersPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "크루원" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "크루 허브로 돌아가기" })).toHaveAttribute(
      "href",
      "/crews/11",
    );

    const items = within(screen.getByRole("list", { name: "크루원 목록" })).getAllByRole("listitem");
    expect(within(items[0]).getByText("leader-one")).toBeInTheDocument();
    expect(within(items[1]).getByText("member-three")).toBeInTheDocument();
    expect(within(items[2]).getByText("member-two")).toBeInTheDocument();

    expect(within(items[0]).getByText("역할: LEADER")).toBeInTheDocument();
    expect(within(items[0]).getByText("가입일: 2026-04-08")).toBeInTheDocument();
    expect(within(items[0]).getByLabelText("leader-one 기본 아바타")).toBeInTheDocument();
    expect(within(items[0]).getByText("소개: 소개 없음")).toBeInTheDocument();
    expect(within(items[0]).getByText("성별: 미설정")).toBeInTheDocument();
    expect(within(items[0]).getByText("탈주 횟수: 0회")).toBeInTheDocument();

    expect(within(items[1]).getByAltText("member-three 프로필 이미지")).toHaveAttribute(
      "src",
      expect.stringContaining(encodeURIComponent("https://example.com/member-three.png")),
    );
    expect(within(items[1]).getByText("소개: 새벽 러닝 좋아해요")).toBeInTheDocument();
    expect(within(items[1]).getByText("성별: FEMALE")).toBeInTheDocument();
    expect(within(items[1]).getByText("탈주 횟수: 1회")).toBeInTheDocument();
  });

  it("shows empty and load failure states without crashing", async () => {
    vi.mocked(getCrewMembers).mockResolvedValueOnce([]);

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
