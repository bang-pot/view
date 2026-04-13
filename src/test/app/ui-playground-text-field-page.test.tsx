import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage text field tab", () => {
  it("renders the text field tab with both variants and design notes", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "text-field" } }));

    expect(screen.getByRole("link", { name: "Text Field" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=text-field",
    );
    expect(screen.getByRole("heading", { name: "Text Field" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Outline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Filled" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getAllByText("Label").length).toBeGreaterThan(0);
  });
});
