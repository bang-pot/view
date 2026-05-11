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
        size: 6,
        hasNext: false,
      },
    });

    render(<PublicCrewsPage />);

    expect(await screen.findByRole("heading", { name: "크루 탐색" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "전체 크루 (2)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BangPot Runners" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByText("Early morning running crew")).toBeInTheDocument();
    const privateCrew = screen.getByRole("link", { name: "BangPot Book Club" }).closest("article");
    expect(privateCrew).not.toBeNull();
    expect(within(privateCrew!).getByText("비공개 크루")).toBeInTheDocument();
    expect(within(privateCrew!).getByText("book-leader")).toBeInTheDocument();
    expect(within(privateCrew!).getByText("멤버 3명")).toBeInTheDocument();
    expect(getExploreCrews).toHaveBeenCalledWith({
      page: 0,
      size: 6,
      sort: "LATEST",
    });
  });

  it("appends the next explore crew page only after clicking 더 보기", async () => {
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
          size: 6,
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
          size: 6,
          hasNext: false,
        },
      });

    render(<PublicCrewsPage />);

    expect(await screen.findByRole("link", { name: "BangPot Runners" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );

    expect(screen.getByRole("button", { name: "더 보기" })).toBeInTheDocument();
    expect(getExploreCrews).toHaveBeenCalledTimes(1);

    observerInstances[0]?.trigger(true);
    expect(getExploreCrews).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));

    expect(await screen.findByRole("link", { name: "BangPot Book Club" })).toHaveAttribute(
      "href",
      "/crews/public/12",
    );
    expect(getExploreCrews).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 6,
      sort: "LATEST",
    });
  });

  it("opens the crew detail modal from a crew card", async () => {
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
      ],
      pageInfo: {
        page: 0,
        size: 6,
        hasNext: false,
      },
    });

    render(<PublicCrewsPage />);

    fireEvent.click(await screen.findByRole("link", { name: "BangPot Runners" }));

    const detailDialog = screen.getByRole("dialog", {
      name: "BangPot Runners",
    });

    expect(detailDialog).toBeInTheDocument();
    expect(within(detailDialog).getByText("한줄 크루 소개")).toBeInTheDocument();
    expect(within(detailDialog).getByText("공개 여부")).toBeInTheDocument();
    expect(within(detailDialog).getByText("크루 인원")).toBeInTheDocument();
    expect(within(detailDialog).getByText("크루장")).toBeInTheDocument();
    expect(within(detailDialog).getByText("참여 기준")).toBeInTheDocument();
    expect(within(detailDialog).getAllByText("크루 문화")).toHaveLength(2);
    expect(
      within(detailDialog).getByText((_, element) =>
        element?.tagName.toLowerCase() === "p" &&
        (element.textContent?.includes("정기 모임에 한 달 2회 이상 참여를 권장합니다.") ?? false),
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the join greeting modal from the crew detail modal", async () => {
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
      ],
      pageInfo: {
        page: 0,
        size: 6,
        hasNext: false,
      },
    });

    render(<PublicCrewsPage />);

    fireEvent.click(await screen.findByRole("link", { name: "BangPot Runners" }));
    fireEvent.click(screen.getByRole("button", { name: "가입하기" }));

    expect(
      screen.getByRole("dialog", {
        name: /가입인사를 남겨보세요/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("내용 작성하기")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("presentation")[1]);

    expect(
      screen.getByRole("dialog", {
        name: "BangPot Runners",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", {
        name: /가입인사를 남겨보세요/,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "가입하기" }));

    fireEvent.click(screen.getByRole("button", { name: "보내기" }));

    expect(
      screen.getByRole("dialog", {
        name: "크루장에게 가입인사를 전달했어요",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "완료" }));

    expect(
      screen.getByRole("dialog", {
        name: "BangPot Runners",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", {
        name: "크루장에게 가입인사를 전달했어요",
      }),
    ).not.toBeInTheDocument();
  });

  it("searches by keyword and reapplies sorting from the first page", async () => {
    vi.mocked(getExploreCrews)
      .mockResolvedValueOnce({
        items: [],
        pageInfo: {
          page: 0,
          size: 6,
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
          size: 6,
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
          size: 6,
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
        size: 6,
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
        size: 6,
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
          size: 6,
          hasNext: false,
        },
      })
      .mockResolvedValueOnce({
        items: [],
        pageInfo: {
          page: 0,
          size: 6,
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
