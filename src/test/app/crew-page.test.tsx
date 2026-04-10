import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewPage from "@/app/crews/[crewId]/page";
import { getPendingCrewJoinRequests } from "@/shared/crew/client";

vi.mock("@/shared/crew/client", () => ({
  createCrew: vi.fn(),
  getPublicCrews: vi.fn(),
  getPublicCrewJoinView: vi.fn(),
  createCrewJoinRequest: vi.fn(),
  getPendingCrewJoinRequests: vi.fn(),
  getCrewJoinRequests: vi.fn(),
  approveCrewJoinRequest: vi.fn(),
  rejectCrewJoinRequest: vi.fn(),
}));

describe("CrewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a join request management entry for crew leaders", async () => {
    vi.mocked(getPendingCrewJoinRequests).mockResolvedValue([
      {
        requestId: 91,
        userId: 7,
        nickname: "runner7",
      },
      {
        requestId: 92,
        userId: 8,
        nickname: "runner8",
      },
    ]);

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("link", { name: "가입 신청 관리" })).toHaveAttribute(
      "href",
      "/crews/11/join-requests",
    );
    expect(screen.getByText("대기 중 2건")).toBeInTheDocument();
    expect(screen.getByText("신청자: runner7, runner8")).toBeInTheDocument();
  });

  it("keeps the crew page minimal for non-leaders", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getPendingCrewJoinRequests).mockRejectedValue(
      new OperationalError({
        code: "AUTH_ACCESS_DENIED",
        message: "접근 권한이 없습니다.",
        requestId: "req-crew-manage-1",
        status: 403,
      }),
    );

    render(await CrewPage({ params: Promise.resolve({ crewId: "11" }) }));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "가입 신청 관리" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Crew ID: 11")).toBeInTheDocument();
  });
});
