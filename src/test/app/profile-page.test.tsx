import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "@/app/profile/page";
import {
  getFavoriteThemesSummary,
  getMe,
  getMyCalendar,
  getMyMeetingLogs,
  getProfile,
  updateProfile,
} from "@/shared/auth/client";
import { getExploreThemeDetail } from "@/shared/explore/client";
import type { ExploreThemeDetail } from "@/shared/explore/types";
import { uploadProfileImage } from "@/shared/image/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getFavoriteThemesSummary: vi.fn(),
  getMe: vi.fn(),
  getMyCalendar: vi.fn(),
  getMyMeetingLogs: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/shared/image/client", () => ({
  uploadProfileImage: vi.fn(),
}));

vi.mock("@/shared/explore/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/explore/client")>(
    "@/shared/explore/client",
  );

  return {
    ...actual,
    getExploreThemeDetail: vi.fn(),
  };
});

function mockFullUser() {
  vi.mocked(getMe).mockResolvedValue({
    authStatus: "FULL",
    completionRequired: false,
    redirectTo: null,
    requiredTermsVersion: "2026-03-25",
    user: { id: 1, nickname: "banglog" },
    requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
  });
}

function mockProfile() {
  vi.mocked(getProfile).mockResolvedValue({
    id: 1,
    nickname: "banglog",
    profileImageUrl: null,
    createdMeetingsCount: 3,
    joinedMeetingsCount: 4,
    myCrewsCount: 2,
    pendingCrewsCount: 1,
  });
}

function mockFavoriteSummary() {
  vi.mocked(getFavoriteThemesSummary).mockResolvedValue({
    items: [
      {
        themeId: 301,
        themeName: "포비든 룸",
        storeName: "서울 이스케이프",
        regionName: "서울 강남",
        thumbnailUrl: null,
        favoriteCount: 12,
        isFavorite: true,
      },
      {
        themeId: 302,
        themeName: "딥 포레스트",
        storeName: "방탈출 스테이션",
        regionName: "서울 홍대",
        thumbnailUrl: "https://cdn.example.com/theme-302.jpg",
        favoriteCount: 9,
        isFavorite: true,
      },
    ],
    totalCount: 7,
    hasMore: true,
  });
}

function mockThemeDetail(overrides: Partial<ExploreThemeDetail> = {}) {
  vi.mocked(getExploreThemeDetail).mockResolvedValue({
    themeId: 301,
    themeName: "포비든 룸",
    storeId: 12,
    storeName: "서울 이스케이프",
    regionLabel: "서울 강남",
    genres: ["공포"],
    posterImageUrl: null,
    difficulty: 3,
    runningTimeMinutes: 75,
    description: "숨겨진 방의 단서를 따라 진실을 찾아야 합니다.",
    externalLink: "https://example.com/forbidden-room",
    isFavorite: true,
    relatedThemes: [],
    ...overrides,
  });
}

function mockMeetingLogs() {
  vi.mocked(getMyMeetingLogs).mockResolvedValue({
    items: [
      {
        logId: 501,
        crewId: 11,
        crewName: "강남 탈출 크루",
        meetingId: 71,
        meetingTitle: "정기 모임 후기",
        meetingDate: "2026-05-15",
        createdAt: "2026-05-16T09:00:00Z",
        excerpt: "이번엔 힌트 3개로 클리어했어요. 난이도가 꽤 높았지만 팀워크가 빛났던 시간이었습니다.",
        coverPhotoUrl: null,
        result: "SUCCESS",
        photoCount: 0,
      },
      {
        logId: 502,
        crewId: 12,
        crewName: "테마이트",
        meetingId: 72,
        meetingTitle: "처음 참여한 정기 모임",
        meetingDate: "2026-05-12",
        createdAt: "2026-05-13T11:00:00Z",
        excerpt: "다들 너무 친절하게 맞이해줬어요.",
        coverPhotoUrl: "https://cdn.example.com/log-cover.jpg",
        result: "SUCCESS",
        photoCount: 2,
      },
    ],
    pageInfo: {
      page: 0,
      size: 3,
      hasNext: true,
    },
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users back to completion before loading the profile hub", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fprofile");
    });
    expect(getProfile).not.toHaveBeenCalled();
    expect(getMyCalendar).not.toHaveBeenCalled();
  });

  it("loads the profile hub and shows the calendar section with selectable schedules", async () => {
    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [
        {
          meetingId: 71,
          meetingTitle: "금요일 방탈출",
          crewId: 3,
          crewName: "방탈출 크루",
          date: "2026-05-15",
          time: "19:00",
          meetingStatus: "RECRUITING",
          isCanceled: false,
          participationRole: "HOST",
        },
        {
          meetingId: 72,
          meetingTitle: "토요일 리벤지",
          crewId: 4,
          crewName: "서울 이스케이프",
          date: "2026-05-18",
          time: "14:00",
          meetingStatus: "CANCELED",
          isCanceled: true,
          participationRole: "PARTICIPANT",
        },
      ],
      totalCount: 2,
    });

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "마이페이지" })).toBeInTheDocument();
    expect(screen.getByLabelText("프로필 이미지 없음")).toBeInTheDocument();
    expect(screen.getByText("banglog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /참여한 모임 4/ })).toHaveAttribute(
      "href",
      "/profile/joined-meetings",
    );
    expect(screen.getByRole("link", { name: /만든 모임 3/ })).toHaveAttribute(
      "href",
      "/profile/created-meetings",
    );
    expect(screen.getByRole("link", { name: /소속 크루 2/ })).toHaveAttribute(
      "href",
      "/profile/crews",
    );
    expect(await screen.findByRole("heading", { name: "방팟 로그" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "방팟 로그 전체보기" })).toHaveAttribute(
      "href",
      "/profile/logs",
    );
    expect(screen.getByText(/이번엔 힌트 3개로 클리어했어요/)).toBeInTheDocument();
    expect(screen.getByText(/\[정기 모임 후기\] · 성공/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "찜한 테마" })).toBeInTheDocument();
    expect(await screen.findByText("포비든 룸 이미지 준비 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "포비든 룸" })).toHaveAttribute(
      "href",
      "/explore/themes/301",
    );
    expect(screen.getByRole("link", { name: "찜한 테마 전체보기" })).toHaveAttribute(
      "href",
      "/profile/favorites",
    );
    expect(screen.getByRole("link", { name: "계정관리" })).toHaveAttribute(
      "href",
      "/profile/withdrawal",
    );

    expect(screen.getByRole("heading", { name: "예정 일정" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "15일 일정 1개" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "18일 취소 1개" })).toBeInTheDocument();
    expect(screen.getByText("금요일 방탈출")).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "18일 취소 1개" }));

    expect(screen.getByText("토요일 리벤지")).toBeInTheDocument();
    expect(screen.getAllByText("서울 이스케이프").length).toBeGreaterThan(0);
    expect(screen.getByText(/취소됨/)).toBeInTheDocument();
  });

  it("opens the explore-style theme detail dialog from the favorite summary", async () => {
    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    mockThemeDetail();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole("link", { name: "포비든 룸" }));

    expect(getExploreThemeDetail).toHaveBeenCalledWith(301);
    expect(await screen.findByRole("dialog", { name: "포비든 룸" })).toBeInTheDocument();
    expect(screen.getByText("테마 소개")).toBeInTheDocument();
    expect(screen.getByText(/숨겨진 방의 단서/)).toBeInTheDocument();
  });

  it("keeps the hub counts from get profile even when patch returns null counts", async () => {
    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    vi.mocked(updateProfile).mockResolvedValue({
      id: 1,
      nickname: "potmaster",
      profileImageUrl: "https://cdn.example.com/profile.jpg",
      createdMeetingsCount: null,
      joinedMeetingsCount: null,
      myCrewsCount: null,
      pendingCrewsCount: null,
    });
    vi.mocked(uploadProfileImage).mockResolvedValue({
      uploadId: 100,
      url: "https://cdn.example.com/temp/profile.jpg",
      sizeBytes: 1024,
    });

    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "프로필 수정" }));
    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "potmaster" } });
    fireEvent.change(screen.getByLabelText("Profile image"), {
      target: { files: [new File(["profile"], "profile.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(uploadProfileImage).toHaveBeenCalledWith(expect.any(File));
      expect(updateProfile).toHaveBeenCalledWith({
        nickname: "potmaster",
        profileImageUploadId: 100,
      });
    });

    expect(screen.getAllByText("potmaster").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /만든 모임 3/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /참여한 모임 4/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /소속 크루 2/ })).toBeInTheDocument();
  });

  it("shows the backend nickname validation message on profile update failure", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
    vi.mocked(updateProfile).mockRejectedValue(
      new OperationalError({
        code: "COMMON_VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다.",
        requestId: "req-profile-validation-1",
        status: 400,
        fieldErrors: [
          {
            field: "nickname",
            message: "닉네임이 비어 있을 수 없습니다.",
          },
        ],
      }),
    );

    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "프로필 수정" }));
    const nicknameInput = await screen.findByLabelText("닉네임");
    fireEvent.change(nicknameInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("닉네임이 비어 있을 수 없습니다.")).toBeInTheDocument();
  });

  it("keeps the profile hub visible when the calendar section fails and allows retry", async () => {
    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    vi.mocked(getMyCalendar)
      .mockRejectedValueOnce(new Error("calendar boom"))
      .mockResolvedValueOnce({
        items: [],
        totalCount: 0,
      });

    render(<ProfilePage />);

    expect(await screen.findByText("banglog")).toBeInTheDocument();
    expect(
      await screen.findByText("달력 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getMyCalendar).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText("아직 표시할 일정이 없어요")).toBeInTheDocument();
  });

  it("opens the profile edit dialog with editable profile fields and closes it", async () => {
    mockFullUser();
    mockProfile();
    mockFavoriteSummary();
    mockMeetingLogs();
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    render(<ProfilePage />);

    expect(await screen.findByRole("heading", { name: "마이페이지" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "프로필 수정" }));

    expect(await screen.findByRole("dialog", { name: "프로필 수정" })).toBeInTheDocument();
    expect(screen.getByLabelText("Profile image")).toBeInTheDocument();
    expect(screen.getByLabelText("닉네임")).toHaveValue("banglog");
    expect(screen.getByLabelText("한줄소개")).toBeInTheDocument();
    expect(screen.getByLabelText("방수")).toBeInTheDocument();
    expect(screen.getByLabelText("성별")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("한줄소개"), { target: { value: "hello" } });

    expect(screen.getByText("5 / 200")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "프로필 수정 닫기" }));

    expect(screen.queryByRole("dialog", { name: "프로필 수정" })).not.toBeInTheDocument();
  });

  it("keeps the profile hub visible when the favorites summary section fails and allows retry", async () => {
    mockFullUser();
    mockProfile();
    mockMeetingLogs();
    vi.mocked(getFavoriteThemesSummary)
      .mockRejectedValueOnce(new Error("favorites boom"))
      .mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        hasMore: false,
      });
    vi.mocked(getMyCalendar).mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    render(<ProfilePage />);

    expect(await screen.findByText("banglog")).toBeInTheDocument();
    expect(
      await screen.findByText("찜한 테마를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(getFavoriteThemesSummary).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText("아직 찜한 테마가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "테마 둘러보기" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });
});
