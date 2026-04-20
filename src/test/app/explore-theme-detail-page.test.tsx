import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExploreThemeDetailPage from "@/app/explore/themes/[themeId]/page";
import { OperationalError } from "@/shared/errors/operational";
import {
  addThemeFavorite,
  getExploreMeetingCreateCrews,
  getExploreThemeDetail,
  removeThemeFavorite,
} from "@/shared/explore/client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
}));

vi.mock("@/shared/explore/client", () => ({
  getExploreThemeDetail: vi.fn(),
  getExploreMeetingCreateCrews: vi.fn(),
  addThemeFavorite: vi.fn(),
  removeThemeFavorite: vi.fn(),
}));

describe("ExploreThemeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the theme detail and reuses favorite cards for related themes", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "첫번째 문장입니다. 두번째 문장입니다. 세번째 문장입니다.",
      externalLink: "https://example.com/theme/7",
      isFavorite: false,
      relatedThemes: [
        {
          themeId: 8,
          themeName: "닫힌 집",
          storeId: 3,
          storeName: "강남 이스케이프",
          regionLabel: "서울 강남",
          genre: "공포",
          posterImageUrl: null,
          difficulty: null,
          runningTimeMinutes: null,
          favoriteCount: 5,
          isFavorite: true,
        },
      ],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByRole("heading", { name: "사라진 서재" })).toBeInTheDocument();

    const detailSection = screen.getByRole("region", { name: "테마 상세 정보" });
    expect(within(detailSection).getByText("강남 이스케이프")).toBeInTheDocument();
    expect(within(detailSection).getByText("서울 강남")).toBeInTheDocument();
    expect(within(detailSection).getByText("장르 추리")).toBeInTheDocument();
    expect(within(detailSection).getByText("난이도 보통")).toBeInTheDocument();
    expect(within(detailSection).getByText("플레이 시간 70분")).toBeInTheDocument();
    expect(within(detailSection).getByRole("button", { name: "찜하기" })).toBeInTheDocument();
    expect(
      within(detailSection).getByRole("link", { name: "외부 예약 페이지 열기" }),
    ).toHaveAttribute("href", "https://example.com/theme/7");

    const relatedSection = screen.getByRole("region", { name: "같은 매장의 다른 테마" });
    expect(
      within(relatedSection).getByRole("link", { name: "닫힌 집 상세 보기" }),
    ).toHaveAttribute("href", "/explore/themes/8");
    expect(within(relatedSection).getByRole("button", { name: "찜 해제" })).toBeInTheDocument();
    expect(within(relatedSection).getByText("5")).toBeInTheDocument();
  });

  it("updates the theme detail favorite state immediately after a successful toggle response", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "설명",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });
    vi.mocked(addThemeFavorite).mockResolvedValue({
      themeId: 7,
      isFavorite: true,
      favoriteCount: 11,
    });
    vi.mocked(removeThemeFavorite).mockResolvedValue({
      themeId: 7,
      isFavorite: false,
      favoriteCount: 10,
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "찜하기" }));
    expect(await screen.findByRole("button", { name: "찜 해제" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "찜 해제" }));
    expect(await screen.findByRole("button", { name: "찜하기" })).toBeInTheDocument();
  });

  it("redirects guests to login when they try to favorite from the theme detail", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "설명",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });
    vi.mocked(addThemeFavorite).mockRejectedValue(
      new OperationalError({
        code: "AUTH_UNAUTHENTICATED",
        userMessage: "로그인이 필요해요.",
        status: 401,
      }),
    );

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "찜하기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login?redirectTo=%2Fexplore%2Fthemes%2F7");
    });
  });

  it("toggles the description between collapsed and expanded states", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description:
        "첫번째 문장입니다. 두번째 문장입니다. 세번째 문장입니다. 네번째 문장입니다. 다섯번째 문장입니다. 여섯번째 문장입니다. 일곱번째 문장입니다. 여덟번째 문장입니다. 아홉번째 문장입니다. 열번째 문장입니다. 열한번째 문장입니다.",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByRole("button", { name: "더보기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "더보기" }));
    expect(screen.getByRole("button", { name: "접기" })).toBeInTheDocument();
  });

  it("shows fallback UI when optional fields are missing", async () => {
    vi.mocked(getExploreThemeDetail).mockRejectedValueOnce(new Error("network"));

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(
      await screen.findByText("테마 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();

    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: null,
      posterImageUrl: null,
      difficulty: null,
      runningTimeMinutes: null,
      description: null,
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    expect(await screen.findByText("등록된 설명이 없습니다.")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "외부 예약 페이지 열기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("같은 매장의 다른 테마가 아직 없어요.")).toBeInTheDocument();
    expect(screen.getByText("장르 정보 준비 중")).toBeInTheDocument();
    expect(screen.getByText("난이도 정보 준비 중")).toBeInTheDocument();
    expect(screen.getByText("플레이 시간 정보 준비 중")).toBeInTheDocument();
  });

  it("opens a crew selection step and routes to meeting create with explore defaults", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "설명",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });
    vi.mocked(getExploreMeetingCreateCrews).mockResolvedValue({
      crews: [
        { crewId: 11, crewName: "미드나잇 러너즈" },
        { crewId: 12, crewName: "심야 탈출단" },
      ],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "이 테마로 모임 만들기" }));

    expect(await screen.findByRole("region", { name: "모임 만들기 크루 선택" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("미드나잇 러너즈"));
    fireEvent.click(screen.getByRole("button", { name: "선택한 크루로 모임 만들기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/crews/11/meetings/new?themeName=%EC%82%AC%EB%9D%BC%EC%A7%84+%EC%84%9C%EC%9E%AC&storeName=%EA%B0%95%EB%82%A8+%EC%9D%B4%EC%8A%A4%EC%BC%80%EC%9D%B4%ED%94%84&regionLabel=%EC%84%9C%EC%9A%B8+%EA%B0%95%EB%82%A8&genre=%EC%B6%94%EB%A6%AC&difficulty=%EB%B3%B4%ED%86%B5&runningTimeMinutes=70",
      );
    });
  });

  it("redirects guests to login for meeting creation and shows an empty-crew guide for members without crews", async () => {
    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "설명",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });
    vi.mocked(getExploreMeetingCreateCrews).mockRejectedValueOnce(
      new OperationalError({
        code: "AUTH_UNAUTHENTICATED",
        userMessage: "로그인이 필요해요.",
        status: 401,
      }),
    );

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "이 테마로 모임 만들기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    cleanup();
    vi.clearAllMocks();
    pushMock.mockReset();

    vi.mocked(getExploreThemeDetail).mockResolvedValue({
      themeId: 7,
      themeName: "사라진 서재",
      storeId: 3,
      storeName: "강남 이스케이프",
      regionLabel: "서울 강남",
      genre: "추리",
      posterImageUrl: null,
      difficulty: "보통",
      runningTimeMinutes: 70,
      description: "설명",
      externalLink: null,
      isFavorite: false,
      relatedThemes: [],
    });
    vi.mocked(getExploreMeetingCreateCrews).mockResolvedValue({
      crews: [],
    });

    render(await ExploreThemeDetailPage({ params: Promise.resolve({ themeId: "7" }) }));

    fireEvent.click(await screen.findByRole("button", { name: "이 테마로 모임 만들기" }));

    expect(
      await screen.findByText("먼저 크루를 만들거나 가입해야 모임을 만들 수 있어요."),
    ).toBeInTheDocument();
  });
});
