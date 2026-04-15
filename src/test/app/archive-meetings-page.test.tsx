import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ArchiveMeetingsPage from "@/app/archive/meetings/page";
import { getArchiveMeetings } from "@/shared/archive/client";
import { getMe } from "@/shared/auth/client";
import { OperationalError } from "@/shared/errors/operational";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/archive/client", () => ({
  getArchiveMeetings: vi.fn(),
}));

describe("ArchiveMeetingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockReset();
    vi.mocked(getArchiveMeetings).mockReset();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders completed archive cards for a logged-in user", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getArchiveMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 101,
          crewId: 11,
          crewName: "미드나잇 러너즈",
          themeName: "브레이크아웃",
          place: "강남 이스케이프",
          date: "2026-04-10",
          result: "SUCCESS",
          posterImageUrl: null,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ArchiveMeetingsPage());

    expect(await screen.findByRole("heading", { name: "완료된 모임 아카이브" })).toBeInTheDocument();
    expect(screen.getByText("브레이크아웃")).toBeInTheDocument();
    expect(screen.getByText("미드나잇 러너즈")).toBeInTheDocument();
    expect(screen.getByText("강남 이스케이프")).toBeInTheDocument();
    expect(screen.getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("결과 성공")).toBeInTheDocument();
    expect(screen.getByText("대표 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방탈로그 작성·수정" })).toHaveAttribute(
      "href",
      "/crews/11/meetings/101/log",
    );
    expect(getArchiveMeetings).toHaveBeenCalledWith({
      page: 0,
      size: 20,
    });
  });

  it("redirects guests to login before loading the archive", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(await ArchiveMeetingsPage());

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Farchive%2Fmeetings");
    });

    expect(getArchiveMeetings).not.toHaveBeenCalled();
  });

  it("loads the next page when the user clicks the load more button", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getArchiveMeetings).mockResolvedValue({
      items: [
        {
          meetingId: 101,
          crewId: 11,
          crewName: "미드나잇 러너즈",
          themeName: "브레이크아웃",
          place: "강남 이스케이프",
          date: "2026-04-10",
          result: "SUCCESS",
          posterImageUrl: null,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });

    render(await ArchiveMeetingsPage());

    await screen.findByRole("heading", { name: "완료된 모임 아카이브" });
    await screen.findByRole("button", { name: "더 보기" });
    vi.mocked(getArchiveMeetings).mockClear();
    vi.mocked(getArchiveMeetings).mockResolvedValueOnce({
      items: [
        {
          meetingId: 102,
          crewId: 12,
          crewName: "방탈출 원정대",
          themeName: "고스트 호텔",
          place: "홍대 이스케이프",
          date: "2026-04-11",
          result: "FAILURE",
          posterImageUrl: null,
        },
      ],
      pageInfo: {
        page: 1,
        size: 20,
        hasNext: false,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(screen.getByText("고스트 호텔")).toBeInTheDocument();
    });
    expect(getArchiveMeetings).toHaveBeenCalledWith({
      page: 1,
      size: 20,
    });
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getArchiveMeetings).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(await ArchiveMeetingsPage());

    await screen.findByRole("heading", { name: "완료된 모임 아카이브" });
    await waitFor(() => {
      expect(screen.getByText("아직 완료된 모임 기록이 없어요")).toBeInTheDocument();
    });

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getArchiveMeetings).mockRejectedValueOnce(
      new OperationalError({
        code: "ARCHIVE_MEETINGS_LOAD_FAILED",
        userMessage: "아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(await ArchiveMeetingsPage());

    expect(
      await screen.findByText("아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });
});
