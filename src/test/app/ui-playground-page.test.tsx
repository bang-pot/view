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
    expect(screen.getByRole("navigation", { name: "Component tabs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=button",
    );
    expect(screen.getByRole("heading", { name: "Button" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Applied preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Small · 32px" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Medium · 40px" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Large · 48px" })).toBeInTheDocument();
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
    expect(screen.getByRole("region", { name: "Small · 14px" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Medium · 16px" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByText("Pretendard 16px")).toBeInTheDocument();
  });

  it("defaults unknown tabs back to the button tab", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "unknown" } }));

    expect(screen.getByRole("heading", { name: "Button" })).toBeInTheDocument();
  });
});
