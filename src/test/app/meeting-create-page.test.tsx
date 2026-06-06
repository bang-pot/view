import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingCreatePage from "@/app/crews/[crewId]/meetings/new/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import { createMeeting } from "@/shared/meeting/client";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const routerMock = {
  push: pushMock,
  replace: replaceMock,
};
const fullUser = {
  authStatus: "FULL",
  completionRequired: false,
  redirectTo: null,
  requiredTermsVersion: "2026-03-25",
  user: { id: 1, nickname: "banglog" },
  requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
} satisfies Awaited<ReturnType<typeof getMe>>;
const memberCrew = {
  crewId: 11,
  name: "Night runners",
  description: "Private crew for late runners",
  visibility: "PRIVATE",
  imageUrl: null,
  myRole: "MEMBER",
  hasNotice: false,
  pendingJoinRequestCount: 0,
} satisfies Awaited<ReturnType<typeof getCrewHub>>;

async function renderMemberCreatePage() {
  vi.mocked(getMe).mockResolvedValue(fullUser);
  vi.mocked(getCrewHub).mockResolvedValue(memberCrew);

  render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));
}

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/crew/client", () => ({
  getCrewHub: vi.fn(),
}));

vi.mock("@/shared/meeting/client", () => ({
  createMeeting: vi.fn(),
}));

describe("MeetingCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the screenshot-based meeting create tab layout for members", async () => {
    await renderMemberCreatePage();

    expect(await screen.findByRole("heading", { name: "모집 만들기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Night runners" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "현재 위치" })).toHaveTextContent(
      "홈 > 크루탐색 > Night runners",
    );
    expect(screen.getByRole("link", { name: "방탈 모집" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("새 방탈출 모임을 만들고 크루원을 모집해보세요.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "테마 설정" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "모임 정보" })).toBeInTheDocument();
    const preview = screen.getByRole("complementary", { name: "모집 미리보기" });
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveTextContent("진행 중");
    expect(preview).toHaveTextContent("예정");
    expect(screen.queryByText("모집 제목 -")).not.toBeInTheDocument();
    expect(screen.queryByText("선택한 테마 -")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "운영 정보" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("장소")).not.toBeInTheDocument();
    expect(screen.getByLabelText("날짜")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("시간")).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByRole("spinbutton", { name: "정원" })).toHaveValue(4);
    expect(screen.getByLabelText("모집 제목")).toHaveAttribute(
      "placeholder",
      "모집 제목을 입력해주세요 (2~30자)",
    );
    expect(screen.getByRole("button", { name: "테마 설정 접기" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "모임 정보 접기" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("모임 설명")).toHaveAttribute(
      "placeholder",
      "일정, 주의사항, 오픈채팅 안내 등을 자유롭게 적어주세요.",
    );
    expect(screen.getByRole("region", { name: "비용" })).toBeInTheDocument();
    expect(screen.getByText("1인당 가격")).toBeInTheDocument();
    expect(screen.getByText("1인당 25,000원")).toBeInTheDocument();
    expect(screen.getByText("현재 4명 기준 총 100,000원 이상")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "연락 링크" })).toBeInTheDocument();
    expect(screen.getByLabelText("오픈채팅 또는 연락 링크")).toHaveAttribute(
      "placeholder",
      "https://open.kakao.com/...",
    );
    expect(screen.getByRole("link", { name: "취소" })).toHaveAttribute("href", "/crews/11/meetings");
    expect(screen.getByRole("button", { name: "모집 만들기" })).toBeInTheDocument();
  });

  it("lets members operate accordions and selectable controls", async () => {
    await renderMemberCreatePage();

    expect(await screen.findByRole("heading", { name: "모집 만들기" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "테마 설정 접기" }));
    expect(screen.queryByLabelText("테마 선택")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "테마 설정 펼치기" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "테마 설정 펼치기" }));
    expect(screen.getByLabelText("테마 선택")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "마감" }));
    expect(screen.getByRole("radio", { name: "마감" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "완료" }));
    expect(screen.getByRole("radio", { name: "완료" })).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "30000" } });
    fireEvent.click(screen.getByRole("button", { name: "1인당 가격" }));
    expect(screen.getByRole("button", { name: "1인당 가격" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("현재 4명 기준 총 120,000원 이상")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("시간"), { target: { value: "1930" } });
    fireEvent.blur(screen.getByLabelText("시간"));
    expect(screen.getByLabelText("시간")).toHaveValue("19:30");

    fireEvent.click(screen.getByRole("button", { name: "연락 링크 접기" }));
    expect(screen.queryByLabelText("오픈채팅 또는 연락 링크")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "운영 정보 접기" })).not.toBeInTheDocument();
  });

  it("keeps invalid crew routes out of the create tab shell", async () => {
    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "not-a-number" }) }));

    expect(screen.getByRole("heading", { name: "모임 만들기" })).toBeInTheDocument();
    expect(screen.getByText("올바르지 않은 크루 경로입니다.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "테마 설정" })).not.toBeInTheDocument();
  });

  it("redirects guests and temp users before showing the meeting create form", async () => {
    vi.mocked(getMe).mockResolvedValueOnce({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Fmeetings%2Fnew");
    });

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getMe).mockResolvedValueOnce({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/crews/11/meetings/new",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fcrews%2F11%2Fmeetings%2Fnew");
    });
  });

  it("creates a meeting and routes members to the meeting detail after success", async () => {
    vi.mocked(getMe).mockResolvedValue(fullUser);
    vi.mocked(getCrewHub).mockResolvedValue(memberCrew);
    vi.mocked(createMeeting).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      title: "금요일 한강 러닝",
      themeName: "러닝",
      place: "장소 미정",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: 120000,
      contactLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요",
      status: "RECRUITING",
    });

    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "모집 만들기" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("모집 제목"), { target: { value: "금요일 한강 러닝" } });
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-04-20" } });
    fireEvent.change(screen.getByLabelText("시간"), { target: { value: "19:30" } });
    fireEvent.change(screen.getByLabelText("테마 선택"), { target: { value: "러닝" } });
    fireEvent.change(screen.getByLabelText("정원"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "120000" } });
    fireEvent.change(screen.getByLabelText("오픈채팅 또는 연락 링크"), {
      target: { value: "https://open.kakao.com/o/example" },
    });
    fireEvent.change(screen.getByLabelText("모임 설명"), { target: { value: "지각 없이 모여 주세요" } });

    expect(screen.getByText("금요일 한강 러닝")).toBeInTheDocument();
    expect(screen.getByText("러닝")).toBeInTheDocument();
    expect(screen.getByText("2026.04.20 19:30")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "모집 만들기" }));

    await waitFor(() => {
      expect(createMeeting).toHaveBeenCalledWith(11, {
        title: "금요일 한강 러닝",
        date: "2026-04-20",
        time: "19:30",
        place: "장소 미정",
        themeName: "러닝",
        capacity: 4,
        totalCost: 120000,
        contactLink: "https://open.kakao.com/o/example",
        description: "지각 없이 모여 주세요",
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/crews/11/meetings/99");
    });
  });

  it("redirects non-members to the public crew introduction", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue(fullUser);
    vi.mocked(getCrewHub).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-meeting-create-1",
        status: 403,
      }),
    );

    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });

  it("prefills meeting defaults from explore theme query params", async () => {
    vi.mocked(getMe).mockResolvedValue(fullUser);
    vi.mocked(getCrewHub).mockResolvedValue(memberCrew);

    render(
      await CrewMeetingCreatePage({
        params: Promise.resolve({ crewId: "11" }),
        searchParams: Promise.resolve({
          themeName: "사라진 서재",
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genre: "추리",
          difficulty: "보통",
          runningTimeMinutes: "70",
        }),
      } as never),
    );

    expect(await screen.findByRole("heading", { name: "모집 만들기" })).toBeInTheDocument();
    expect(screen.getByLabelText("테마 선택")).toHaveValue("사라진 서재");
    expect(screen.queryByLabelText("장소")).not.toBeInTheDocument();
    expect(screen.getByLabelText("모임 설명")).toHaveValue(
      "매장: 강남 이스케이프\n지역: 서울 강남\n장르: 추리\n난이도: 보통\n플레이 시간: 70분",
    );
  });
});
