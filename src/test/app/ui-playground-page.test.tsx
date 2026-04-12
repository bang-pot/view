import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage", () => {
  it("renders the button tab with previews and figma summaries", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "button" } }));

    expect(screen.getByRole("heading", { name: "UI Playground" })).toBeInTheDocument();
    expect(screen.getByText("URL-only preview space for shared components.")).toBeInTheDocument();
    expect(screen.getByText("Current route: /playground/ui")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Component tabs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=button",
    );
    expect(screen.getByRole("heading", { name: "Button" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Applied preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Variant x Size" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "State preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Icon combinations" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getByText("button/primaryBg")).toBeInTheDocument();
    expect(screen.getByText("Pretendard 14px")).toBeInTheDocument();
  });

  it("renders the text button tab with component previews", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "text-button" } }));

    const tabNavigation = screen.getByRole("navigation", { name: "Component tabs" });

    expect(within(tabNavigation).getByRole("link", { name: "Text Button" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=text-button",
    );
    expect(screen.getByRole("heading", { name: "Text Button" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Variant x Size" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Type preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByText("Pretendard 13px")).toBeInTheDocument();
  });
});
