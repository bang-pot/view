import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewPage from "@/app/crews/[crewId]/page";
import {
  approveCrewJoinRequest,
  deleteCrew,
  getCrewDeletionAvailability,
  getCrewHub,
  getCrewJoinRequests,
  getCrewMembers,
  getCrewPolicies,
  rejectCrewJoinRequest,
  removeCrewMember,
  transferCrewLeadership,
} from "@/shared/crew/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/crew/client", () => ({
  createCrew: vi.fn(),
  deleteCrew: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  getCrewHub: vi.fn(),
  getCrewDeletionAvailability: vi.fn(),
  getCrewSchedule: vi.fn(),
  updateCrewVisibility: vi.fn(),
  transferCrewLeadership: vi.fn(),
  removeCrewMember: vi.fn(),
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
    expect(screen.getByRole("button", { name: "크루 관리 설정" })).toBeInTheDocument();

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
    expect(screen.queryByRole("button", { name: "크루 관리 설정" })).not.toBeInTheDocument();
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

  it("opens the crew management settings modal for leaders", async () => {
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
    vi.mocked(getCrewDeletionAvailability).mockResolvedValue({
      crewId: 11,
      canDelete: false,
      hasOnlyLeader: true,
      hasNoUnfinishedMeetings: false,
    });
    vi.mocked(getCrewPolicies).mockResolvedValue([
      {
        policyId: 1,
        title: "참여 기준",
        content: "정기 모임에 한 달 2회 이상 참여를 권장합니다.",
      },
      {
        policyId: 2,
        title: "비용 정산",
        content: "방탈출 비용은 참여 인원이 동일하게 나눕니다.",
      },
      {
        policyId: 3,
        title: "크루 문화",
        content: "방탈출 중 다른 팀이나 운영진의 힌트를 엿듣거나 방해하는 행위는 금지합니다.",
      },
    ]);
    vi.mocked(getCrewJoinRequests).mockResolvedValue({
      items: [
        {
          requestId: 21,
          userId: 101,
          nickname: "김민지",
          message: "방탈출 50방 돌파 기념으로 크루 활동을 시작하고 싶습니다. 잘 부탁드려요!",
          status: "PENDING",
        },
        {
          requestId: 22,
          userId: 102,
          nickname: "박민수",
          message: null,
          status: "PENDING",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(approveCrewJoinRequest).mockResolvedValue({
      crewId: 11,
      requestId: 21,
      userId: 101,
      role: "MEMBER",
    });
    vi.mocked(rejectCrewJoinRequest).mockResolvedValue({
      crewId: 11,
      requestId: 22,
    });
    vi.mocked(getCrewMembers).mockResolvedValue({
      items: [
        {
          userId: 1,
          nickname: "이탈출",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 35,
          role: "LEADER",
          joinedAt: "2023.03.15",
        },
        {
          userId: 2,
          nickname: "김방방",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 64,
          role: "MEMBER",
          joinedAt: "2024.01.22",
        },
        {
          userId: 3,
          nickname: "박탈탈",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 112,
          role: "MEMBER",
          joinedAt: "2024.03.08",
        },
        {
          userId: 4,
          nickname: "최힌트",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 38,
          role: "MEMBER",
          joinedAt: "2024.07.19",
        },
        {
          userId: 5,
          nickname: "정잠금",
          profileImageUrl: null,
          bio: null,
          gender: null,
          escapeCount: 15,
          role: "MEMBER",
          joinedAt: "2025.02.01",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(transferCrewLeadership).mockResolvedValue({
      crewId: 11,
      leaderUserId: 2,
    });
    vi.mocked(removeCrewMember).mockResolvedValue({
      crewId: 11,
      removedUserId: 1,
    });

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "크루 관리 설정" }));

    const dialog = await screen.findByRole("dialog", { name: "크루 관리 설정" });
    expect(within(dialog).getByRole("button", { name: "닫기" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "기본 정보" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(dialog).getByRole("button", { name: "공지 사항 관리" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "크루 정책 관리" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "가입 신청 관리" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "멤버 관리" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "크루 삭제" })).toBeInTheDocument();

    expect(within(dialog).getByRole("heading", { name: "기본 정보" })).toBeInTheDocument();
    expect(within(dialog).getByText("크루의 기본 정보를 수정합니다.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("크루 이름")).toHaveValue("서울 탈출러");
    expect(within(dialog).getByLabelText("크루 소개")).toHaveValue("함께 탈출하는 서울 친구들");
    expect(within(dialog).getByLabelText("공개 설정")).toBeChecked();
    expect(within(dialog).getByRole("button", { name: "사진 추가" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "변경사항 저장" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "공지 사항 관리" }));

    expect(within(dialog).getByRole("heading", { name: "공지 사항 관리" })).toBeInTheDocument();
    expect(
      within(dialog).getByText("공지는 항상 1개만 표시됩니다. 공지를 추가하면 기존 공지는 비공개 처리됩니다."),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("공지 작성시 전화번호, 계좌번호 등 개인정보가 포함되지 않도록 주의해 주세요."),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "+ 새 공지 추가" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "새 공지 추가" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("등록된 공지가 없습니다.")).toBeInTheDocument();
    expect(within(dialog).queryAllByRole("button", { name: "수정" })).toHaveLength(0);
    expect(within(dialog).queryAllByRole("button", { name: "삭제" })).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "+ 새 공지 추가" }));

    expect(within(dialog).getByRole("heading", { name: "새 공지 추가" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("내용")).toHaveValue("");
    expect(within(dialog).getByRole("button", { name: "저장" })).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("내용"), {
      target: { value: "이번 주 토요일 정기 모임 장소가 강남으로 변경되었습니다." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(within(dialog).getByRole("button", { name: "+ 새 공지 추가" })).toBeInTheDocument();
    expect(within(dialog).getByText("이번 주 토요일 정기 모임 장소가 강남으로 변경되었습니다.")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "수정" })).toHaveLength(1);
    expect(within(dialog).getAllByRole("button", { name: "삭제" })).toHaveLength(1);

    fireEvent.click(within(dialog).getByRole("button", { name: "수정" }));

    expect(within(dialog).getByRole("heading", { name: "공지 수정" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("내용")).toHaveValue(
      "이번 주 토요일 정기 모임 장소가 강남으로 변경되었습니다.",
    );
    fireEvent.change(within(dialog).getByLabelText("내용"), {
      target: { value: "이번 주 토요일 정기 모임 장소가 홍대로 다시 변경되었습니다." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "수정하기" }));

    expect(within(dialog).getByRole("button", { name: "+ 새 공지 추가" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "공지 수정" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("이번 주 토요일 정기 모임 장소가 홍대로 다시 변경되었습니다.")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("이번 주 토요일 정기 모임 장소가 강남으로 변경되었습니다."),
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

    const noticeDeleteConfirmation = await within(dialog).findByRole("alertdialog", { name: "공지 삭제" });
    expect(within(noticeDeleteConfirmation).getByText("공지를 삭제하시겠습니까?")).toBeInTheDocument();
    fireEvent.click(within(noticeDeleteConfirmation).getByRole("button", { name: "삭제하기" }));

    await waitFor(() => {
      expect(within(dialog).queryByRole("alertdialog", { name: "공지 삭제" })).not.toBeInTheDocument();
    });
    expect(
      within(dialog).queryByText("이번 주 토요일 정기 모임 장소가 홍대로 다시 변경되었습니다."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("등록된 공지가 없습니다.")).toBeInTheDocument();
    expect(within(dialog).queryAllByRole("button", { name: "수정" })).toHaveLength(0);
    expect(within(dialog).queryAllByRole("button", { name: "삭제" })).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "크루 정책 관리" }));

    expect(within(dialog).getByRole("heading", { name: "크루 정책 관리" })).toBeInTheDocument();
    expect(within(dialog).getByText("정책을 추가하고 최대 500자까지 작성할 수 있습니다.")).toBeInTheDocument();
    expect(
      within(dialog).getByText("정책 작성 시 전화번호, 계좌번호 등 개인정보가 포함되지 않도록 주의해 주세요."),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "+ 정책 추가" })).toBeInTheDocument();
    expect(await within(dialog).findByText("참여 기준")).toBeInTheDocument();
    expect(getCrewPolicies).toHaveBeenCalledWith(11);
    expect(within(dialog).getByText("정기 모임에 한 달 2회 이상 참여를 권장합니다.")).toBeInTheDocument();
    expect(within(dialog).getByText("비용 정산")).toBeInTheDocument();
    expect(within(dialog).getByText("크루 문화")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "수정" })).toHaveLength(3);
    expect(within(dialog).getAllByRole("button", { name: "삭제" })).toHaveLength(3);

    fireEvent.click(within(dialog).getByRole("button", { name: "+ 정책 추가" }));

    expect(within(dialog).getByRole("heading", { name: "새 정책 추가" })).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("제목"), {
      target: { value: "스포일러 금지" },
    });
    fireEvent.change(within(dialog).getByLabelText("내용"), {
      target: { value: "진행 중인 테마의 문제나 장치 정보를 공개하지 않습니다." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(within(dialog).getByRole("button", { name: "+ 정책 추가" })).toBeInTheDocument();
    expect(within(dialog).getByText("스포일러 금지")).toBeInTheDocument();
    expect(within(dialog).getByText("진행 중인 테마의 문제나 장치 정보를 공개하지 않습니다.")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "수정" })).toHaveLength(4);

    fireEvent.click(within(dialog).getAllByRole("button", { name: "수정" })[3]);

    expect(within(dialog).getByRole("heading", { name: "정책 수정" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("제목")).toHaveValue("스포일러 금지");
    expect(within(dialog).getByLabelText("내용")).toHaveValue("진행 중인 테마의 문제나 장치 정보를 공개하지 않습니다.");
    fireEvent.change(within(dialog).getByLabelText("내용"), {
      target: { value: "진행 중인 테마의 문제, 장치, 정답 정보를 공개하지 않습니다." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "수정하기" }));

    expect(within(dialog).getByRole("button", { name: "+ 정책 추가" })).toBeInTheDocument();
    expect(within(dialog).getByText("진행 중인 테마의 문제, 장치, 정답 정보를 공개하지 않습니다.")).toBeInTheDocument();

    fireEvent.click(within(dialog).getAllByRole("button", { name: "삭제" })[3]);

    const policyDeleteConfirmation = await within(dialog).findByRole("alertdialog", { name: "정책 삭제" });
    expect(within(policyDeleteConfirmation).getByText("정책을 삭제하시겠습니까?")).toBeInTheDocument();
    fireEvent.click(within(policyDeleteConfirmation).getByRole("button", { name: "삭제하기" }));

    await waitFor(() => {
      expect(within(dialog).queryByRole("alertdialog", { name: "정책 삭제" })).not.toBeInTheDocument();
    });
    expect(within(dialog).queryByText("스포일러 금지")).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "수정" })).toHaveLength(3);

    fireEvent.click(within(dialog).getByRole("button", { name: "가입 신청 관리" }));

    expect(within(dialog).getByRole("heading", { name: "가입 신청 관리" })).toBeInTheDocument();
    expect(await within(dialog).findByText("2건")).toBeInTheDocument();
    expect(getCrewJoinRequests).toHaveBeenCalledWith(11);
    expect(within(dialog).getByText("대기 중인 가입 신청을 검토하고 승인하거나 거절하세요.")).toBeInTheDocument();
    expect(within(dialog).getByText("김민지")).toBeInTheDocument();
    expect(within(dialog).getByText("박민수")).toBeInTheDocument();
    expect(within(dialog).getByText("방탈출 50방 돌파 기념으로 크루 활동을 시작하고 싶습니다. 잘 부탁드려요!")).toBeInTheDocument();
    expect(within(dialog).getByText("가입 신청 메시지가 없습니다.")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "거절" })).toHaveLength(2);
    expect(within(dialog).getAllByRole("button", { name: "승인" })).toHaveLength(2);

    fireEvent.click(within(dialog).getAllByRole("button", { name: "승인" })[0]);

    await waitFor(() => {
      expect(approveCrewJoinRequest).toHaveBeenCalledWith(11, 21);
      expect(within(dialog).getByText("1건")).toBeInTheDocument();
      expect(within(dialog).getAllByRole("button", { name: "거절" })).toHaveLength(1);
      expect(within(dialog).getAllByRole("button", { name: "승인" })).toHaveLength(1);
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "거절" }));

    await waitFor(() => {
      expect(rejectCrewJoinRequest).toHaveBeenCalledWith(11, 22);
      expect(within(dialog).getByText("대기 중인 가입 신청이 없습니다.")).toBeInTheDocument();
      expect(within(dialog).queryByText("1건")).not.toBeInTheDocument();
      expect(within(dialog).getByText("0건")).toBeInTheDocument();
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "멤버 관리" }));

    expect(within(dialog).getByRole("heading", { name: "멤버 관리" })).toBeInTheDocument();
    expect(await within(dialog).findByText("총 5명")).toBeInTheDocument();
    expect(getCrewMembers).toHaveBeenCalledWith(11);
    expect(within(dialog).getByText("크루원 목록을 관리하고 권한을 위임하거나 크루원을 퇴출하세요.")).toBeInTheDocument();
    expect(within(dialog).getByText("이탈출")).toBeInTheDocument();
    expect(within(dialog).getByText("김방방")).toBeInTheDocument();
    expect(within(dialog).getByText("박탈탈")).toBeInTheDocument();
    expect(within(dialog).getAllByText("크루장")).toHaveLength(1);
    expect(within(dialog).getAllByText("크루원")).toHaveLength(4);
    expect(within(dialog).getAllByRole("button", { name: "위임" })).toHaveLength(4);
    expect(within(dialog).getAllByRole("button", { name: "퇴출" })).toHaveLength(4);

    fireEvent.click(within(dialog).getAllByRole("button", { name: "위임" })[0]);

    await waitFor(() => {
      expect(transferCrewLeadership).toHaveBeenCalledWith(11, 2);
      const memberList = within(dialog).getByRole("list", { name: "멤버 목록" });
      const delegatedMemberItem = within(memberList).getByText("김방방").closest("li");
      expect(delegatedMemberItem).not.toBeNull();
      expect(within(delegatedMemberItem as HTMLElement).getByText("크루장")).toBeInTheDocument();
    });

    fireEvent.click(within(dialog).getAllByRole("button", { name: "퇴출" })[0]);

    await waitFor(() => {
      expect(removeCrewMember).toHaveBeenCalledWith(11, 1);
      expect(within(dialog).getByText("총 4명")).toBeInTheDocument();
      expect(within(dialog).getAllByRole("button", { name: "위임" })).toHaveLength(3);
      expect(within(dialog).getAllByRole("button", { name: "퇴출" })).toHaveLength(3);
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "크루 삭제" }));

    expect(await within(dialog).findByText("크루 삭제는 아래 조건을 만족시켜야 합니다.")).toBeInTheDocument();
    expect(getCrewDeletionAvailability).toHaveBeenCalledWith(11);
    expect(within(dialog).getByText("크루장 외의 남아 있는 크루원이 없어야 합니다.")).toBeInTheDocument();
    expect(
      within(dialog).getByText("해당 크루 안에 완료되지 않은 모임이 있으면 크루 삭제를 할 수 없습니다."),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "크루삭제" })).toBeDisabled();
  });

  it("opens a confirmation dialog before deleting a deletable crew", async () => {
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
    vi.mocked(getCrewDeletionAvailability).mockResolvedValue({
      crewId: 11,
      canDelete: true,
      hasOnlyLeader: true,
      hasNoUnfinishedMeetings: true,
    });
    vi.mocked(deleteCrew).mockResolvedValue({
      crewId: 11,
      deleted: true,
    });

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "크루 관리 설정" }));

    const dialog = await screen.findByRole("dialog", { name: "크루 관리 설정" });
    fireEvent.click(within(dialog).getByRole("button", { name: "크루 삭제" }));

    const deleteButton = await within(dialog).findByRole("button", { name: "크루삭제" });
    expect(deleteButton).toBeEnabled();

    fireEvent.click(deleteButton);

    const confirmation = await within(dialog).findByRole("alertdialog", { name: "크루 삭제" });
    expect(within(confirmation).getByText("크루를 삭제하시겠습니까?")).toBeInTheDocument();
    expect(
      within(confirmation).getByText("삭제된 크루의 방탈로그, 모임 일정, 사진 등 모든 정보는 제거되며, 복구할 수 없습니다."),
    ).toBeInTheDocument();

    fireEvent.click(within(confirmation).getByRole("button", { name: "삭제하기" }));

    await waitFor(() => {
      expect(deleteCrew).toHaveBeenCalledWith(11, "서울 탈출러");
    });
    expect(replaceMock).toHaveBeenCalledWith("/?notice=crew-deleted");
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
