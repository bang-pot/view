import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage color badge tab", () => {
  it("renders the color badge tab with solid and outline matrices", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "color-badge" } }));

    const tabNavigation = screen.getByRole("navigation", { name: "Component tabs" });

    expect(within(tabNavigation).getByRole("link", { name: "Color Badge" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=color-badge",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Color Badge" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Solid" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Outline" })).toBeInTheDocument();
    expect(screen.getAllByText("Yellow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Purple").length).toBeGreaterThan(0);
    expect(screen.getAllByText("S").length).toBeGreaterThan(1);
    expect(screen.getAllByText("M").length).toBeGreaterThan(1);
    expect(screen.getAllByText("L").length).toBeGreaterThan(1);
  });
});
