import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage chip tab", () => {
  it("renders the chip tab with previews and token summary", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "chip" } }));

    const tabNavigation = screen.getByRole("navigation", { name: "Component tabs" });

    expect(within(tabNavigation).getByRole("link", { name: "Chip" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=chip",
    );
    expect(screen.getByRole("heading", { name: "Chip" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Applied preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Normal" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Solid" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma design notes" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getByText("normal / solid")).toBeInTheDocument();
    expect(screen.getByText("button/primaryBg")).toBeInTheDocument();
  });
});
