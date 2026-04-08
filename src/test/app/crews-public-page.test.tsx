import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicCrewsPage from "@/app/crews/public/page";
import { getPublicCrews } from "@/shared/crew/client";

vi.mock("@/shared/crew/client", () => ({
  getPublicCrews: vi.fn(),
}));

describe("PublicCrewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public crew cards from the backend discovery contract", async () => {
    vi.mocked(getPublicCrews).mockResolvedValue([
      {
        crewId: 11,
        name: "BangPot Runners",
        description: "Early morning running crew",
        visibility: "PUBLIC",
        imageUrl: null,
      },
      {
        crewId: 12,
        name: "BangPot Book Club",
        description: "Monthly reading meetup",
        visibility: "PUBLIC",
        imageUrl: null,
      },
    ]);

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
  });
});
