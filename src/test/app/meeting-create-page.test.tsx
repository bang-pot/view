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
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
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
    vi.mocked(createMeeting).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      title: "금요일 한강 러닝",
      themeName: "러닝",
      place: "강남역",
      date: "2026-04-20",
      time: "19:30",
      capacity: 4,
      totalCost: 120000,
      contactLink: "https://open.kakao.com/o/example",
      description: "지각 없이 모여 주세요",
      status: "RECRUITING",
      result: "NOT_RECORDED",
    });

    render(await CrewMeetingCreatePage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "모임 만들기" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "금요일 한강 러닝" } });
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-04-20" } });
    fireEvent.change(screen.getByLabelText("시간"), { target: { value: "19:30" } });
    fireEvent.change(screen.getByLabelText("장소"), { target: { value: "강남역" } });
    fireEvent.change(screen.getByLabelText("테마명"), { target: { value: "러닝" } });
    fireEvent.change(screen.getByLabelText("정원"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("비용 안내 (총 비용)"), { target: { value: "120000" } });
    fireEvent.change(screen.getByLabelText("연락 링크"), {
      target: { value: "https://open.kakao.com/o/example" },
    });
    fireEvent.change(screen.getByLabelText("설명"), { target: { value: "지각 없이 모여 주세요" } });
    fireEvent.click(screen.getByRole("button", { name: "모임 생성" }));

    await waitFor(() => {
      expect(createMeeting).toHaveBeenCalledWith(11, {
        title: "금요일 한강 러닝",
        date: "2026-04-20",
        time: "19:30",
        place: "강남역",
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

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
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
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
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

    expect(await screen.findByRole("heading", { name: "모임 만들기" })).toBeInTheDocument();
    expect(screen.getByLabelText("테마명")).toHaveValue("사라진 서재");
    expect(screen.getByLabelText("장소")).toHaveValue("서울 강남 · 강남 이스케이프");
    expect(screen.getByLabelText("설명")).toHaveValue(
      "매장: 강남 이스케이프\n지역: 서울 강남\n장르: 추리\n난이도: 보통\n플레이 시간: 70분",
    );
  });
});
