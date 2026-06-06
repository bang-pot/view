import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getMeetingDetailMock,
  getMyMeetingLogMock,
  makeDeletedBlockedLog,
  makeExistingLog,
  makeMeetingDetail,
  makeNotWrittenLog,
  mockCrew,
  mockCurrentUser,
  renderMeetingDetailPage,
  resetMeetingDetailMocks,
} from "./meeting-detail-page.fixtures";

describe("MeetingDetailPage log actions", () => {
  beforeEach(() => {
    resetMeetingDetailMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the write log entry when the current user can write a completed meeting log", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );
    getMyMeetingLogMock.mockResolvedValue(makeNotWrittenLog());

    await renderMeetingDetailPage();

    const detailSection = await screen.findByRole("region", { name: "모임 상세 정보" });
    expect(
      await within(detailSection).findByRole("link", { name: "방탈로그 작성하기" }),
    ).toHaveAttribute("href", "/crews/11/meetings/99/log");
  });

  it("blocks the write log entry when the log was deleted in the same session", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );
    getMyMeetingLogMock.mockResolvedValue(makeDeletedBlockedLog());

    await renderMeetingDetailPage();

    const detailSection = await screen.findByRole("region", { name: "모임 상세 정보" });
    expect(
      within(detailSection).queryByRole("link", { name: "방탈로그 작성하기" }),
    ).not.toBeInTheDocument();
    expect(
      within(detailSection).getByText("삭제된 방탈로그가 있어 다시 작성할 수 없어요."),
    ).toBeInTheDocument();
  });

  it("shows the edit log entry when the current user already has a log", async () => {
    mockCurrentUser(1);
    mockCrew("LEADER");
    getMeetingDetailMock.mockResolvedValue(
      makeMeetingDetail({
        status: "COMPLETED",
      }),
    );
    getMyMeetingLogMock.mockResolvedValue(makeExistingLog());

    await renderMeetingDetailPage();

    const detailSection = await screen.findByRole("region", { name: "모임 상세 정보" });
    expect(
      await within(detailSection).findByRole("link", { name: "방탈로그 수정하기" }),
    ).toHaveAttribute("href", "/crews/11/meetings/99/log");
  });
});
