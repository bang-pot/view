import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage select tab", () => {
  it("renders the select tab with state previews and design notes", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "select" } }));

    expect(screen.getByRole("link", { name: "Select" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=select",
    );
    expect(screen.getByRole("heading", { name: "Select" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "State matrix" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getAllByText("Select").length).toBeGreaterThan(0);
  });
});
