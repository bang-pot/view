import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicCrewsPage from "@/app/crews/public/page";
import { getPublicCrews } from "@/shared/crew/client";

vi.mock("@/shared/crew/client", () => ({
  getPublicCrews: vi.fn(),
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

  it("renders public crew cards from the backend discovery contract", async () => {
    vi.mocked(getPublicCrews).mockResolvedValue({
      items: [
        {
          crewId: 11,
          name: "BangPot Runners",
          description: "Early morning running crew",
          imageUrl: null,
        },
        {
          crewId: 12,
          name: "BangPot Book Club",
          description: "Monthly reading meetup",
          imageUrl: null,
        },
      ],
      pageInfo: {
        page: 0,
        size: 20,
        hasNext: false,
      },
    });

    render(<PublicCrewsPage />);

    expect(await screen.findByRole("heading", { name: "Public crews" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BangPot Runners" })).toHaveAttribute(
      "href",
      "/crews/public/11",
    );
    expect(screen.getByText("Early morning running crew")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BangPot Book Club" })).toHaveAttribute(
      "href",
      "/crews/public/12",
    );
    expect(screen.queryByText(/Visibility:/)).not.toBeInTheDocument();
    expect(getPublicCrews).toHaveBeenCalledWith({
      page: 0,
      size: 20,
    });
  });

  it("appends the next public crew page when the sentinel enters the viewport", async () => {
    vi.mocked(getPublicCrews)
      .mockResolvedValueOnce({
        items: [
          {
            crewId: 11,
            name: "BangPot Runners",
            description: "Early morning running crew",
            imageUrl: null,
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
    expect(getPublicCrews).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 20,
    });
  });
});
