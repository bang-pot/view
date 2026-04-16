import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewGalleryPage from "@/app/crews/[crewId]/gallery/page";
import { getMe } from "@/shared/auth/client";
import { getCrewGallery, getCrewGalleryDetail } from "@/shared/gallery/client";
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

vi.mock("@/shared/gallery/client", () => ({
  getCrewGallery: vi.fn(),
  getCrewGalleryDetail: vi.fn(),
}));

describe("CrewGalleryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders crew gallery cards for an active member", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValue({
      items: [
        {
          meetingId: 99,
          meetingDate: "2026-04-10",
          meetingTitle: "금요일 이스케이프 번개",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByRole("heading", { name: "크루 사진첩" })).toBeInTheDocument();
    expect(screen.getByText("사진이 등록된 완료된 모임만 모아보고 있어요.")).toBeInTheDocument();
    expect(screen.getByText("금요일 이스케이프 번개")).toBeInTheDocument();
    expect(screen.getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("대표 사진 준비 중")).toBeInTheDocument();
    expect(screen.getByText("+ 2장")).toBeInTheDocument();
  });

  it("opens a modal detail and lightbox without losing the loaded list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValue({
      items: [
        {
          meetingId: 99,
          meetingDate: "2026-04-10",
          meetingTitle: "금요일 이스케이프 번개",
          coverPhotoUrl: "https://cdn.example.com/gallery/cover.jpg",
          extraPhotoCount: 2,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(getCrewGalleryDetail).mockResolvedValue({
      meetingId: 99,
      meetingDate: "2026-04-10",
      meetingTitle: "금요일 이스케이프 번개",
      photos: [
        { photoId: 1, url: "https://cdn.example.com/gallery/1.jpg", order: 1 },
        { photoId: 2, url: "https://cdn.example.com/gallery/2.jpg", order: 2 },
        { photoId: 3, url: "https://cdn.example.com/gallery/3.jpg", order: 3 },
        { photoId: 4, url: "https://cdn.example.com/gallery/4.jpg", order: 4 },
      ],
      totalPhotoCount: 4,
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    fireEvent.click(await screen.findByTestId("gallery-card-button-99"));

    const modal = await screen.findByTestId("gallery-detail-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-detail-close")).toBeInTheDocument();
    expect(screen.getAllByTestId(/gallery-thumb-button-/)).toHaveLength(4);

    fireEvent.click(screen.getByTestId("gallery-thumb-button-2"));

    expect(await screen.findByTestId("gallery-lightbox")).toBeInTheDocument();
    expect(screen.getByText("2 / 4")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("gallery-lightbox-next"));
    expect(await screen.findByText("3 / 4")).toBeInTheDocument();

    const lightbox = screen.getByTestId("gallery-lightbox");
    fireEvent.touchStart(lightbox, {
      changedTouches: [{ clientX: 240 }],
    });
    fireEvent.touchEnd(lightbox, {
      changedTouches: [{ clientX: 80 }],
    });

    expect(await screen.findByText("4 / 4")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("gallery-lightbox-close"));
    await waitFor(() => {
      expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("gallery-detail-close"));
    await waitFor(() => {
      expect(screen.queryByTestId("gallery-detail-modal")).not.toBeInTheDocument();
    });

    expect(screen.getByText("금요일 이스케이프 번개")).toBeInTheDocument();
  });

  it("falls back to the placeholder when the cover image fails to load", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValue({
      items: [
        {
          meetingId: 101,
          meetingDate: "2026-04-12",
          meetingTitle: "수요일 미스터리 번개",
          coverPhotoUrl: "https://cdn.example.com/gallery/cover.jpg",
          extraPhotoCount: 0,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    const image = await screen.findByRole("img", { name: "수요일 미스터리 번개 대표 사진" });
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText("대표 사진 준비 중")).toBeInTheDocument();
    });
  });

  it("loads the next page when the user clicks load more", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValueOnce({
      items: [
        {
          meetingId: 99,
          meetingDate: "2026-04-10",
          meetingTitle: "금요일 이스케이프 번개",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });
    vi.mocked(getCrewGallery).mockResolvedValueOnce({
      items: [
        {
          meetingId: 100,
          meetingDate: "2026-04-12",
          meetingTitle: "수요일 사냥 번개",
          coverPhotoUrl: null,
          extraPhotoCount: 0,
        },
      ],
      pageInfo: {
        page: 1,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByRole("heading", { name: "크루 사진첩" });
    fireEvent.click(await screen.findByRole("button", { name: "더보기" }));

    await waitFor(() => {
      expect(screen.getByText("수요일 사냥 번개")).toBeInTheDocument();
    });

    expect(getCrewGallery).toHaveBeenLastCalledWith(11, { page: 1, size: 20 });
  });

  it("keeps already loaded cards visible when load more fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValueOnce({
      items: [
        {
          meetingId: 99,
          meetingDate: "2026-04-10",
          meetingTitle: "금요일 이스케이프 번개",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: true,
      },
    });
    vi.mocked(getCrewGallery).mockRejectedValueOnce(
      new OperationalError({
        code: "CREW_GALLERY_LOAD_FAILED",
        userMessage: "크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await screen.findByText("금요일 이스케이프 번개");
    fireEvent.click(await screen.findByRole("button", { name: "더보기" }));

    expect(
      await screen.findByText("크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("금요일 이스케이프 번개")).toBeInTheDocument();
    expect(screen.getByText("+ 2장")).toBeInTheDocument();
  });

  it("shows a modal error state without clearing the loaded cards", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValue({
      items: [
        {
          meetingId: 99,
          meetingDate: "2026-04-10",
          meetingTitle: "금요일 이스케이프 번개",
          coverPhotoUrl: null,
          extraPhotoCount: 2,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(getCrewGalleryDetail).mockRejectedValue(
      new OperationalError({
        code: "GALLERY_DETAIL_LOAD_FAILED",
        userMessage: "사진 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    fireEvent.click(await screen.findByTestId("gallery-card-button-99"));

    expect(await screen.findByTestId("gallery-detail-modal")).toBeInTheDocument();
    expect(
      screen.getByText("사진 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("금요일 이스케이프 번개")).toBeInTheDocument();
  });

  it("shows empty and error states without breaking", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(await screen.findByText("아직 사진이 없네요.")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    replaceMock.mockReset();

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "bangpot" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockRejectedValueOnce(
      new OperationalError({
        code: "CREW_GALLERY_LOAD_FAILED",
        userMessage: "크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        status: 500,
      }),
    );

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    expect(
      await screen.findByText("크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("redirects guests and non-members away from the gallery", async () => {
    vi.mocked(getMe).mockResolvedValueOnce({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2F11%2Fgallery");
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
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewGallery).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        userMessage: "현재 크루원만 볼 수 있어요.",
        status: 403,
      }),
    );

    render(
      await CrewGalleryPage({
        params: Promise.resolve({ crewId: "11" }),
      }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/crews/public/11");
    });
  });
});
