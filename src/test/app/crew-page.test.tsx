import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
  getPublicCrewJoinView: vi.fn(),
  getCrewHub: vi.fn(),
  getCrewSchedule: vi.fn(),
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

  it("renders the crew workspace dashboard for leaders", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "서울 탈출러",
      description: "함께 탈출하는 서울 친구들",
      visibility: "PUBLIC",
      imageUrl: null,
      myRole: "LEADER",
      hasNotice: true,
      pendingJoinRequestCount: 3,
    });

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "서울 탈출러" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "주요 메뉴" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "현재 위치" })).toHaveTextContent(
      "홈 > 크루탐색 > 서울 탈출러",
    );
    expect(screen.getByRole("region", { name: "크루 요약" })).toHaveTextContent("크루장");
    expect(screen.getByRole("region", { name: "크루 요약" })).toHaveTextContent("닉네임");
    expect(screen.getByRole("region", { name: "크루 요약" })).toHaveTextContent("5명");
    expect(screen.getByRole("region", { name: "크루 요약" })).toHaveTextContent("공개");
    expect(screen.getByRole("link", { name: "크루 관리 설정" })).toHaveAttribute(
      "href",
      "/crews/11/settings",
    );

    expect(screen.getByRole("navigation", { name: "크루 내부 메뉴" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "광장" })).toHaveAttribute("href", "/crews/11");
    expect(screen.getByRole("link", { name: "정책" })).toHaveAttribute("href", "/crews/11/policies");
    expect(screen.getByRole("link", { name: "크루원" })).toHaveAttribute("href", "/crews/11/members");
    expect(screen.getByRole("link", { name: "방장 일정" })).toHaveAttribute(
      "href",
      "/crews/11/schedule",
    );
    expect(screen.getByRole("link", { name: "방탈 모집" })).toHaveAttribute(
      "href",
      "/crews/11/meetings",
    );
    expect(screen.getByRole("link", { name: "사진첩" })).toHaveAttribute("href", "/crews/11/gallery");
    expect(screen.getByRole("link", { name: "방탈로그" })).toHaveAttribute("href", "/crews/11/logs");

    expect(screen.getByText("새로운 가입 신청 3건이 대기 중입니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "신청자 보기" })).toHaveAttribute(
      "href",
      "/crews/11/join-requests",
    );
    expect(screen.getByRole("heading", { name: "오늘의 한마디" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("한마디 남길 메시지를 입력하세요")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "주간 일정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text Button" })).toHaveAttribute(
      "data-type",
      "icon-left",
    );
    expect(screen.getByRole("heading", { name: "최근 방탈로그" })).toBeInTheDocument();
    expect(screen.getAllByText("+2장").length).toBeGreaterThan(0);
    expect(screen.queryByText("+2명")).not.toBeInTheDocument();

    const textOnlyLogCard = screen.getByText("이번 주 크루 기록").closest("article");
    expect(textOnlyLogCard).not.toBeNull();
    expect(within(textOnlyLogCard as HTMLElement).queryByText("+2장")).not.toBeInTheDocument();
  });

  it("hides leader-only actions for normal crew members", async () => {
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "서울 탈출러",
      description: "함께 탈출하는 서울 친구들",
      visibility: "PRIVATE",
      imageUrl: null,
      myRole: "MEMBER",
      hasNotice: false,
      pendingJoinRequestCount: 0,
    });

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "서울 탈출러" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "크루 요약" })).toHaveTextContent("크루원");
    expect(screen.queryByRole("link", { name: "크루 관리 설정" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "신청자 보기" })).not.toBeInTheDocument();
    expect(screen.queryByText(/가입 신청/)).not.toBeInTheDocument();
    expect(screen.getByText("공지사항")).toBeInTheDocument();
    expect(screen.getByText("크루원에게 공유할 공지를 확인해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText("이 크루의 공통 안내는 아직 준비 중입니다.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방장 일정" })).toHaveAttribute(
      "href",
      "/crews/11/schedule",
    );
    expect(screen.getByRole("link", { name: "방탈로그" })).toHaveAttribute("href", "/crews/11/logs");
    expect(screen.getByRole("link", { name: "사진첩" })).toHaveAttribute("href", "/crews/11/gallery");
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
