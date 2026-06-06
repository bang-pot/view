import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OperationalError } from "@/shared/errors/operational";
import {
  cancelMeetingJoinMock,
  closeMeetingRecruitmentMock,
  getCrewHubMock,
  getMeetingDetailMock,
  joinMeetingMock,
  makeMeetingDetail,
  mockCrew,
  mockCurrentUser,
  renderMeetingDetailPage,
  replaceMock,
  resetMeetingDetailMocks,
} from "./meeting-detail-page.fixtures";

describe("MeetingDetailPage", () => {
  beforeEach(() => {
    resetMeetingDetailMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the meeting detail with the current states and cost guidance", async () => {
    mockCurrentUser(44);
    mockCrew();
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        totalCost: 120000,
        contactLink: "https://open.kakao.com/o/example",
        description: "지각 없이 모여 주세요.",
      }),
    );

    await renderMeetingDetailPage();

    expect(await screen.findByRole("heading", { name: "금요일 늦은 번개", level: 1 })).toBeInTheDocument();

    const detailSection = screen.getByRole("region", { name: "모임 상세 정보" });
    const participationSection = screen.getByRole("region", { name: "모임 참가 상태" });

    expect(screen.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", "/crews/11/meetings");
    expect(within(detailSection).getByText("테마명: 미스터리 룸")).toBeInTheDocument();
    expect(within(detailSection).getByText("총 비용 안내: 120,000원")).toBeInTheDocument();
    expect(within(detailSection).getByText("1인당 예상 비용: 30,000원")).toBeInTheDocument();
    expect(
      within(detailSection).getByText("연락 링크: https://open.kakao.com/o/example"),
    ).toBeInTheDocument();
    expect(within(participationSection).getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(within(participationSection).getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모임 운영" })).not.toBeInTheDocument();
  });

  it("renders the non-host joinable meeting as the designed detail card", async () => {
    mockCurrentUser(44);
    mockCrew();
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        title: "모임 제목",
        themeName: "어비스 : 0층의 주민들",
        place: "서울 강남구 강남대로 340",
        date: "2026-06-10",
        time: "19:00",
        capacity: 6,
        participantCount: 4,
        totalCost: 15000,
        description:
          "이번에 이스케이프 ESC 강남점의 어비스 테마에 도전할 크루원을 모집합니다.",
      }),
    );

    await renderMeetingDetailPage();

    expect(await screen.findByRole("link", { name: "목록으로" })).toHaveAttribute(
      "href",
      "/crews/11/meetings",
    );
    expect(screen.getByRole("heading", { name: "모임 제목", level: 1 })).toBeInTheDocument();

    const detailCard = screen.getByRole("region", { name: "모임 상세 카드" });
    expect(within(detailCard).getByText("테마")).toBeInTheDocument();
    expect(within(detailCard).getByText("어비스 : 0층의 주민들")).toBeInTheDocument();
    expect(within(detailCard).getAllByText("4 / 6명")).toHaveLength(2);
    expect(within(detailCard).getByText("방장")).toBeInTheDocument();
    expect(within(detailCard).getByText("이탈출")).toBeInTheDocument();
    expect(within(detailCard).getByRole("button", { name: "참여하기" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모집 마감" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모임 운영" })).not.toBeInTheDocument();
  });

  it("shows host actions inside the detail card only for the meeting host", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(makeMeetingDetail());

    await renderMeetingDetailPage();

    const detailCard = await screen.findByRole("region", { name: "모임 상세 카드" });

    expect(within(detailCard).getByRole("link", { name: "수정하기" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/99/edit",
    );
    expect(within(detailCard).getByRole("button", { name: "모집 마감" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모임 운영" })).not.toBeInTheDocument();
  });

  it("hides the edit entry for non-host users and completed meetings", async () => {
    mockCurrentUser(44);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(makeMeetingDetail());

    await renderMeetingDetailPage();

    await screen.findByRole("region", { name: "모임 상세 카드" });
    expect(screen.getByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "모집 마감" })).not.toBeInTheDocument();

    cleanup();
    resetMeetingDetailMocks();

    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );

    await renderMeetingDetailPage();

    await screen.findByRole("region", { name: "모임 상세 카드" });
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모임 운영" })).not.toBeInTheDocument();
  });

  it("updates the participation status to joined after a successful instant join", async () => {
    mockCurrentUser(44);
    mockCrew();
    getMeetingDetailMock.mockResolvedValue(makeMeetingDetail());
    joinMeetingMock.mockResolvedValue({
      meetingId: 99,
      myParticipationStatus: "JOINED",
    });

    await renderMeetingDetailPage();

    const participationSection = await screen.findByRole("region", { name: "모임 참가 상태" });
    fireEvent.click(within(participationSection).getByRole("button", { name: "참여하기" }));

    await waitFor(() => {
      expect(joinMeetingMock).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: JOINED")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "모임 참가 상태" })).getByRole("button", {
        name: "참여취소",
      }),
    ).toBeInTheDocument();
  });

  it("updates the participation status to not-joined after a successful cancel", async () => {
    mockCurrentUser(44);
    mockCrew();
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        myParticipationStatus: "JOINED",
      }),
    );
    cancelMeetingJoinMock.mockResolvedValue({
      meetingId: 99,
      myParticipationStatus: "NOT_JOINED",
    });

    await renderMeetingDetailPage();

    const participationSection = await screen.findByRole("region", { name: "모임 참가 상태" });
    fireEvent.click(within(participationSection).getByRole("button", { name: "참여취소" }));

    await waitFor(() => {
      expect(cancelMeetingJoinMock).toHaveBeenCalledWith(11, 99);
    });

    expect(await screen.findByText("내 참가 상태: NOT_JOINED")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "모임 참가 상태" })).getByRole("button", {
        name: "참여하기",
      }),
    ).toBeInTheDocument();
  });

  it("shows operation actions for the host and updates the meeting status immediately", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(makeMeetingDetail());
    closeMeetingRecruitmentMock.mockResolvedValue({
      meetingId: 99,
      status: "RECRUITMENT_CLOSED",
    });

    await renderMeetingDetailPage();

    const participationSection = await screen.findByRole("region", { name: "모임 참가 상태" });
    fireEvent.click(within(participationSection).getByRole("button", { name: "모집 마감" }));

    await waitFor(() => {
      expect(closeMeetingRecruitmentMock).toHaveBeenCalledWith(11, 99);
    });

    expect(screen.getByText("마감")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모임 운영" })).not.toBeInTheDocument();
  });

  it("does not show a meeting-level result section on the detail page", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );

    await renderMeetingDetailPage();

    await screen.findByRole("region", { name: "모임 상세 정보" });

    expect(screen.queryByRole("region", { name: "모임 결과" })).not.toBeInTheDocument();
  });

  it("redirects non-members to the public crew introduction", async () => {
    mockCurrentUser(44);
    getCrewHubMock.mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-meeting-detail-1",
        status: 403,
      }),
    );

    await renderMeetingDetailPage();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
