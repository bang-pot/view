import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewMeetingEditPage from "@/app/crews/[crewId]/meetings/[meetingId]/edit/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import { getMeetingDetail, updateMeeting } from "@/shared/meeting/client";

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
  getMeetingDetail: vi.fn(),
  updateMeeting: vi.fn(),
}));

function mockCurrentUser(id: number) {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-04-01",
    requiredTermsAcceptedAt: "2026-04-01T00:00:00Z",
    user: {
      id,
      nickname: "tester",
    },
  });
}

function mockCrewHub() {
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
}

function mockMeetingDetail(overrides: Partial<Awaited<ReturnType<typeof getMeetingDetail>>> = {}) {
  vi.mocked(getMeetingDetail).mockResolvedValue({
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
    myParticipationStatus: "JOINED",
    ...overrides,
  });
}

describe("MeetingEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads the create flow with the existing meeting fields for the host", async () => {
    mockCurrentUser(1);
    mockCrewHub();
    mockMeetingDetail();

    render(
      await CrewMeetingEditPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "모집 수정하기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Night runners" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방탈 모집" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("기존 방탈출 모임 정보를 수정합니다.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "테마 설정" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "모임 정보" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "비용" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "연락 링크" })).toBeInTheDocument();
    const preview = screen.getByRole("complementary", { name: "모집 미리보기" });
    expect(preview).toBeInTheDocument();
    expect(screen.getByDisplayValue("금요일 한강 러닝")).toBeInTheDocument();
    expect(screen.getByDisplayValue("러닝")).toBeInTheDocument();
    expect(screen.queryByLabelText("장소")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("https://open.kakao.com/o/example")).toBeInTheDocument();
    expect(screen.getByText("2026.04.20 19:30")).toBeInTheDocument();
    expect(screen.getByText("120,000원")).toBeInTheDocument();
    expect(within(preview).getByRole("link", { name: "취소" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99",
    );
    expect(within(preview).getByRole("button", { name: "모집 수정하기" })).toBeInTheDocument();
  });

  it("patches the meeting and routes back to detail after success", async () => {
    mockCurrentUser(1);
    mockCrewHub();
    mockMeetingDetail();
    vi.mocked(updateMeeting).mockResolvedValue({
      meetingId: 99,
      crewId: 11,
      hostUserId: 1,
      title: "수정된 모임 제목",
      themeName: "보드게임",
      place: "성수",
      date: "2026-04-21",
      time: "20:00",
      capacity: 6,
      totalCost: 90000,
      contactLink: "https://open.kakao.com/o/updated",
      description: "수정된 설명",
      status: "RECRUITMENT_CLOSED",
    });

    render(
      await CrewMeetingEditPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    fireEvent.change(await screen.findByLabelText("모집 제목"), { target: { value: "수정된 모임 제목" } });
    fireEvent.change(screen.getByLabelText("테마 선택"), { target: { value: "보드게임" } });
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-04-21" } });
    fireEvent.change(screen.getByLabelText("시간"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByLabelText("정원"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "90000" } });
    fireEvent.change(screen.getByLabelText("오픈채팅 또는 연락 링크"), {
      target: { value: "https://open.kakao.com/o/updated" },
    });
    fireEvent.change(screen.getByLabelText("모임 설명"), { target: { value: "수정된 설명" } });
    const preview = screen.getByRole("complementary", { name: "모집 미리보기" });
    fireEvent.click(within(preview).getByRole("button", { name: "모집 수정하기" }));

    await waitFor(() => {
      expect(updateMeeting).toHaveBeenCalledWith(11, 99, {
        title: "수정된 모임 제목",
        themeName: "보드게임",
        place: "강남역",
        date: "2026-04-21",
        time: "20:00",
        capacity: 6,
        totalCost: 90000,
        contactLink: "https://open.kakao.com/o/updated",
        description: "수정된 설명",
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/crews/11/meetings/99?notice=meeting-updated");
    });
  });

  it("blocks direct editing when the current user is not the host", async () => {
    mockCurrentUser(44);
    mockCrewHub();
    mockMeetingDetail({
      hostUserId: 1,
    });

    render(
      await CrewMeetingEditPage({
        params: Promise.resolve({ crewId: "11", meetingId: "99" }),
      }),
    );

    expect(await screen.findByText("이 모임은 지금 수정할 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모집 수정하기" })).not.toBeInTheDocument();
  });
});
