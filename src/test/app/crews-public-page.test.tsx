import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicCrewsPage from "@/app/crews/public/page";
import { getExploreCrews } from "@/shared/crew/client";

vi.mock("@/shared/crew/client", () => ({
  getExploreCrews: vi.fn(),
}));

const observerInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observerInstances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  trigger(isIntersecting = true) {
    this.callback(
      [
        {
          isIntersecting,
          target: document.createElement("div"),
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

describe("PublicCrewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observerInstances.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders explore crew cards from the backend discovery contract", async () => {
    vi.mocked(getExploreCrews).mockResolvedValue({
      items: [
        {
          crewId: 11,
          name: "BangPot Runners",
          description: "Early morning running crew",
          imageUrl: null,
          visibility: "PUBLIC",
          leaderNickname: "runner-leader",
          memberCount: 12,
        },
        {
          crewId: 12,
          name: "BangPot Book Club",
          description: "Monthly reading meetup",
          imageUrl: null,
          visibility: "PRIVATE",
          leaderNickname: "book-leader",
          memberCount: 3,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<PublicCrewsPage />);

    expect(await screen.findByRole("heading", { name: "크루 탐색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BangPot Runners" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByText("Early morning running crew")).toBeInTheDocument();
    const privateCrew = screen.getByRole("link", { name: "BangPot Book Club" }).closest("article");
    expect(privateCrew).not.toBeNull();
    expect(within(privateCrew!).getByText("비공개")).toBeInTheDocument();
    expect(within(privateCrew!).getByText("크루장 book-leader")).toBeInTheDocument();
    expect(within(privateCrew!).getByText("멤버 3명")).toBeInTheDocument();
    expect(getExploreCrews).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: "LATEST",
    });
  });

  it("appends the next explore crew page when the sentinel enters the viewport", async () => {
    vi.mocked(getExploreCrews)
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 11,
            name: "BangPot Runners",
            description: "Early morning running crew",
            imageUrl: null,
            visibility: "PUBLIC",
            leaderNickname: "runner-leader",
            memberCount: 12,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: true,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 12,
            name: "BangPot Book Club",
            description: "Monthly reading meetup",
            imageUrl: null,
            visibility: "PRIVATE",
            leaderNickname: "book-leader",
            memberCount: 3,
          },
        ],
        pageInfo: {
          page: 1,
          size: 20,
          hasNext: false,
        },
      });

    render(<PublicCrewsPage />);

    expect(await screen.findByRole("link", { name: "BangPot Runners" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );

    observerInstances[0]?.trigger(true);

    expect(await screen.findByRole("link", { name: "BangPot Book Club" })).toHaveAttribute(
      "href",
      "/crews/public/12",
    );
    expect(getExploreCrews).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 20,
      sort: "LATEST",
    });
  });

  it("searches by keyword and reapplies sorting from the first page", async () => {
    vi.mocked(getExploreCrews)
      .mockResolvedValueOnce({
        items: [],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 22,
            name: "방탈 원정대",
            description: "주말 방탈출 크루",
            imageUrl: null,
            visibility: "PRIVATE",
            leaderNickname: "방장닉",
            memberCount: 12,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 23,
            name: "방탈 새싹",
            description: null,
            imageUrl: null,
            visibility: "PUBLIC",
            leaderNickname: "새싹장",
            memberCount: 2,
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<PublicCrewsPage />);

    expect(await screen.findByText("아직 표시할 크루가 없습니다.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("크루 검색"), {
      target: {
        value: "방탈",
      },
    });

    await waitFor(() => {
      expect(getExploreCrews).toHaveBeenNthCalledWith(2, {
        page: 0,
        size: 20,
        keyword: "방탈",
        sort: "LATEST",
      });
    });

    expect(await screen.findByRole("link", { name: "방탈 원정대" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("정렬"), {
      target: {
        value: "MEMBER_COUNT_ASC",
      },
    });

    await waitFor(() => {
      expect(getExploreCrews).toHaveBeenNthCalledWith(3, {
        page: 0,
        size: 20,
        keyword: "방탈",
        sort: "MEMBER_COUNT_ASC",
      });
    });
  });

  it("distinguishes empty list and empty search result states", async () => {
    vi.mocked(getExploreCrews)
      .mockResolvedValueOnce({
        items: [],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      })
      .mockResolvedValueOnce({
        items: [],
        pageInfo: {
          page: 0,
          size: 20,
          hasNext: false,
        },
      });

    render(<PublicCrewsPage />);

    expect(await screen.findByText("아직 표시할 크루가 없습니다.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("크루 검색"), {
      target: {
        value: "없는크루",
      },
    });

    expect(await screen.findByText("검색 결과 없음")).toBeInTheDocument();
  });
});
