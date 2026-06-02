import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewGalleryPage from "@/app/crews/[crewId]/gallery/page";
import CrewLogFeedPage from "@/app/crews/[crewId]/logs/page";
import CrewMeetingsPage from "@/app/crews/[crewId]/meetings/page";
import CrewMembersPage from "@/app/crews/[crewId]/members/page";
import CrewSchedulePage from "@/app/crews/[crewId]/schedule/page";
import { getMe } from "@/shared/auth/client";
import { getCrewHub, getCrewMembers, getCrewSchedule } from "@/shared/crew/client";
import { getCrewGallery } from "@/shared/gallery/client";
import { getCrewLogFeed } from "@/shared/log/client";
import { getMeetings } from "@/shared/meeting/client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/crew/client", () => ({
  getCrewHub: vi.fn(),
  getCrewMembers: vi.fn(),
  getCrewSchedule: vi.fn(),
  transferCrewLeadership: vi.fn(),
  removeCrewMember: vi.fn(),
}));

vi.mock("@/shared/gallery/client", () => ({
  getCrewGallery: vi.fn(),
  getCrewGalleryDetail: vi.fn(),
}));

vi.mock("@/shared/log/client", () => ({
  getCrewLogFeed: vi.fn(),
}));

vi.mock("@/shared/meeting/client", () => ({
  getMeetings: vi.fn(),
}));

describe("Crew workspace tab routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    vi.mocked(getCrewHub).mockResolvedValue({
      crewId: 11,
      name: "서울 탈출러",
      description: "함께 탈출하는 서울 친구들",
      visibility: "PUBLIC",
      imageUrl: null,
      myRole: "MEMBER",
      hasNotice: true,
      pendingJoinRequestCount: 0,
    });
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(getCrewMembers).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getCrewSchedule).mockResolvedValue({ items: [] });
    vi.mocked(getMeetings).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getCrewGallery).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
    vi.mocked(getCrewLogFeed).mockResolvedValue({
      items: [],
      pageInfo: { page: 0, size: 20, hasNext: false },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    ["크루원", CrewMembersPage, "크루원"],
    ["방장 일정", CrewSchedulePage, "방탈 일정"],
    ["방탈 모집", CrewMeetingsPage, "모임 목록"],
    ["사진첩", CrewGalleryPage, "크루 사진첩"],
    ["방탈로그", CrewLogFeedPage, "방탈로그"],
  ])("renders the %s tab inside the fixed crew workspace layout", async (tabName, Page, heading) => {
    render(await Page({ params: Promise.resolve({ crewId: "11" }) }));

    expect(await screen.findByRole("heading", { name: "서울 탈출러" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "현재 위치" })).toHaveTextContent(
      "홈 > 크루탐색 > 서울 탈출러",
    );
    expect(screen.getByRole("link", { name: tabName })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("공지사항")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
