import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicCrewDetailPage from "@/app/crews/public/[crewId]/page";
import {
  createCrewJoinRequest,
  getPublicCrewJoinView,
} from "@/shared/crew/client";

vi.mock("@/shared/crew/client", () => ({
  getPublicCrews: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  createCrewJoinRequest: vi.fn(),
}));

describe("PublicCrewDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a login action for guest users on the public crew intro screen", async () => {
    vi.mocked(getPublicCrewJoinView).mockResolvedValue({
      crewId: 33,
      name: "BangPot Climbers",
      description: "Weekend climbing crew",
      visibility: "PUBLIC",
      imageUrl: null,
      myStatus: "GUEST",
    });

    render(await PublicCrewDetailPage({ params: Promise.resolve({ crewId: "33" }) }));

    expect(await screen.findByRole("heading", { name: "BangPot Climbers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인 후 가입 신청" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Fcrews%2Fpublic%2F33",
    );
  });

  it("submits an optional join request message, shows a success modal, and keeps the pending state", async () => {
    vi.mocked(getPublicCrewJoinView).mockResolvedValue({
      crewId: 33,
      name: "BangPot Climbers",
      description: "Weekend climbing crew",
      visibility: "PUBLIC",
      imageUrl: null,
      myStatus: "CAN_REQUEST",
    });
    vi.mocked(createCrewJoinRequest).mockResolvedValue({
      crewId: 33,
      myStatus: "PENDING",
    });

    render(await PublicCrewDetailPage({ params: Promise.resolve({ crewId: "33" }) }));

    expect(await screen.findByRole("button", { name: "가입 신청" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Join request message"), {
      target: { value: "같이 운동하고 싶어요." },
    });
    fireEvent.click(screen.getByRole("button", { name: "가입 신청" }));

    await waitFor(() => {
      expect(createCrewJoinRequest).toHaveBeenCalledWith(33, {
        message: "같이 운동하고 싶어요.",
      });
    });

    expect(await screen.findByRole("dialog", { name: "가입 신청 완료" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "승인 대기 중" })).toBeDisabled();
    });
  });

  it("shows the backend field error when the join request message exceeds 200 characters", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getPublicCrewJoinView).mockResolvedValue({
      crewId: 33,
      name: "BangPot Climbers",
      description: "Weekend climbing crew",
      visibility: "PUBLIC",
      imageUrl: null,
      myStatus: "CAN_REQUEST",
    });
    vi.mocked(createCrewJoinRequest).mockRejectedValue(
      new OperationalError({
        code: "COMMON_VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다.",
        requestId: "req-join-message-1",
        status: 400,
        fieldErrors: [
          {
            field: "message",
            message: "신청 메시지는 200자 이하여야 합니다.",
          },
        ],
      }),
    );

    render(await PublicCrewDetailPage({ params: Promise.resolve({ crewId: "33" }) }));

    await screen.findByRole("button", { name: "가입 신청" });
    fireEvent.change(screen.getByLabelText("Join request message"), {
      target: { value: "x".repeat(201) },
    });
    fireEvent.click(screen.getByRole("button", { name: "가입 신청" }));

    expect(await screen.findByText("신청 메시지는 200자 이하여야 합니다.")).toBeInTheDocument();
  });

  it("shows member and private restricted states without expanding the internal crew page", async () => {
    vi.mocked(getPublicCrewJoinView)
      .mockResolvedValueOnce({
        crewId: 33,
        name: "BangPot Climbers",
        description: "Weekend climbing crew",
        visibility: "PUBLIC",
        imageUrl: null,
        myStatus: "MEMBER",
      })
      .mockResolvedValueOnce({
        crewId: 44,
        name: "BangPot Secret Club",
        description: "Invite only",
        visibility: "PRIVATE",
        imageUrl: null,
        myStatus: "PRIVATE_RESTRICTED",
      });

    const memberPage = await PublicCrewDetailPage({ params: Promise.resolve({ crewId: "33" }) });
    render(memberPage);

    expect(await screen.findByRole("link", { name: "크루 페이지로 이동" })).toHaveAttribute(
      "href",
      "/crews/33",
    );

    cleanup();

    const privatePage = await PublicCrewDetailPage({ params: Promise.resolve({ crewId: "44" }) });
    render(privatePage);

    expect(await screen.findByRole("button", { name: "가입 신청 불가" })).toBeDisabled();
    expect(screen.getByText("비공개 크루는 직접 가입 신청할 수 없습니다.")).toBeInTheDocument();
  });
});
