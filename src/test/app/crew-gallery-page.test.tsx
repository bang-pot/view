import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewGalleryPage from "@/app/crews/[crewId]/gallery/page";
import { getMe } from "@/shared/auth/client";
import { getCrewGallery } from "@/shared/gallery/client";
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
}));

describe("CrewGalleryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
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
          meetingTitle: "금요일 이스케이프 벙개",
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
    expect(screen.getByText("금요일 이스케이프 벙개")).toBeInTheDocument();
    expect(screen.getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.getByText("대표 사진 준비 중")).toBeInTheDocument();
    expect(screen.getByText("+ 2장")).toBeInTheDocument();
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
          meetingTitle: "토요일 미스터리 벙개",
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

    const image = await screen.findByRole("img", { name: "토요일 미스터리 벙개 대표 사진" });
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
          meetingTitle: "금요일 이스케이프 벙개",
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
          meetingTitle: "토요일 심야 벙개",
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
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    await waitFor(() => {
      expect(screen.getByText("토요일 심야 벙개")).toBeInTheDocument();
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
          meetingTitle: "금요일 이스케이프 벙개",
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

    await screen.findByText("금요일 이스케이프 벙개");
    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    expect(
      await screen.findByText("크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("금요일 이스케이프 벙개")).toBeInTheDocument();
    expect(screen.getByText("+ 2장")).toBeInTheDocument();
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
