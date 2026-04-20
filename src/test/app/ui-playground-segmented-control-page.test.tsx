import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage segmented control tab", () => {
  it("renders the segmented control tab with interactive preview and state matrix", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "segmented-control" } }));

    const tabNavigation = screen.getByRole("navigation", { name: "Component tabs" });

    expect(within(tabNavigation).getByRole("link", { name: "Segmented Control" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=segmented-control",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Segmented Control" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Segmented Control" })).toBeInTheDocument();
    expect(screen.getByText("1번 선택")).toBeInTheDocument();
    expect(screen.getByText("2번 선택")).toBeInTheDocument();
    expect(screen.getByText("3번 선택")).toBeInTheDocument();
    expect(screen.getAllByText("Icon + Text").length).toBeGreaterThan(0);
  });
});
