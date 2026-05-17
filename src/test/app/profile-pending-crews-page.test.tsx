import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PendingCrewsProfilePage from "@/app/profile/pending-crews/page";
import { cancelPendingCrew, getMe, getPendingCrews } from "@/shared/auth/client";

const replaceMock = vi.fn();
const routerMock = {
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
  getPendingCrews: vi.fn(),
  cancelPendingCrew: vi.fn(),
}));

describe("PendingCrewsProfilePage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects temp users to completion before loading the pending crews list", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/profile/pending-crews",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<PendingCrewsProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/auth/complete?redirectTo=%2Fprofile%2Fpending-crews",
      );
    });
    expect(getPendingCrews).not.toHaveBeenCalled();
  });

  it("renders pending crew items with message fallback and no crew detail link", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [
        {
          joinRequestId: 91,
          crewId: 17,
          crewName: "방탈출 크루",
          requestedAt: "2026-04-17T09:00:00Z",
          messageSummary: "주말 위주로 참여하고 싶어요.",
        },
        {
          joinRequestId: 92,
          crewId: 18,
          crewName: "심야 크루",
          requestedAt: "2026-04-16T21:30:00Z",
          messageSummary: "",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<PendingCrewsProfilePage />);

    expect(await screen.findByRole("heading", { name: "가입 대기 중 크루" })).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();
    expect(screen.getByText("심야 크루")).toBeInTheDocument();
    expect(screen.getByText("주말 위주로 참여하고 싶어요.")).toBeInTheDocument();
    expect(screen.getByText("메시지 없음")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "가입 신청 취소" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "방탈출 크루" })).not.toBeInTheDocument();
  });

  it("removes a canceled request immediately and switches to the empty state after the last item", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [
        {
          joinRequestId: 91,
          crewId: 17,
          crewName: "방탈출 크루",
          requestedAt: "2026-04-17T09:00:00Z",
          messageSummary: "주말 위주로 참여하고 싶어요.",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(cancelPendingCrew).mockResolvedValue({
      joinRequestId: 91,
      crewId: 17,
    });

    render(<PendingCrewsProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "가입 신청 취소" }));

    expect(await screen.findByText("정말 취소하시겠어요?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => {
      expect(cancelPendingCrew).toHaveBeenCalledWith(91);
    });

    expect(await screen.findByText("현재 대기 중인 가입 신청이 없어요")).toBeInTheDocument();
    expect(screen.queryByText("방탈출 크루")).not.toBeInTheDocument();
  });

  it("keeps the list visible when load more fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getPendingCrews)
      .mockResolvedValueOnce({
        items: [
          {
            joinRequestId: 91,
            crewId: 17,
            crewName: "방탈출 크루",
            requestedAt: "2026-04-17T09:00:00Z",
            messageSummary: "주말 위주로 참여하고 싶어요.",
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockRejectedValueOnce(new Error("boom"));

    render(<PendingCrewsProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "더 보기" }));

    expect(
      await screen.findByText("가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("방탈출 크루")).toBeInTheDocument();
  });

  it("shows a retry affordance when the first load fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getPendingCrews)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            joinRequestId: 91,
            crewId: 17,
            crewName: "방탈출 크루",
            requestedAt: "2026-04-17T09:00:00Z",
            messageSummary: null,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<PendingCrewsProfilePage />);

    expect(
      await screen.findByText("가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("방탈출 크루")).toBeInTheDocument();
  });

  it("keeps the list and shows an action error when cancel fails", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-03-31T00:00:00Z",
    });
    vi.mocked(getPendingCrews).mockResolvedValue({
      items: [
        {
          joinRequestId: 91,
          crewId: 17,
          crewName: "방탈출 크루",
          requestedAt: "2026-04-17T09:00:00Z",
          messageSummary: "주말 위주로 참여하고 싶어요.",
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
    vi.mocked(cancelPendingCrew).mockRejectedValue(new Error("boom"));

    render(<PendingCrewsProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "가입 신청 취소" }));
    fireEvent.click(await screen.findByRole("button", { name: "확인" }));

    const item = await screen.findByRole("listitem");
    expect(
      await within(item).findByText("가입 신청 취소에 실패했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(within(item).getByText("방탈출 크루")).toBeInTheDocument();
  });
});
