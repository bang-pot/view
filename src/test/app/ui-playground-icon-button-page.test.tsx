import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage icon button tab", () => {
  it("renders the icon button tab with previews and token summary", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "icon-button" } }));

    const tabNavigation = screen.getByRole("navigation", { name: "Component tabs" });

    expect(within(tabNavigation).getByRole("link", { name: "Icon Button" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=icon-button",
    );
    expect(screen.getByRole("heading", { name: "Icon Button" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Applied preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Variant x State" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma design notes" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getByText("button/ghostBorder")).toBeInTheDocument();
    expect(screen.getByText("Normal / Background / Outline")).toBeInTheDocument();
  });
});
