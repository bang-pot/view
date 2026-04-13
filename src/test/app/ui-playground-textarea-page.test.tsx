import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage textarea tab", () => {
  it("renders the textarea tab with both variants and design notes", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "textarea" } }));

    expect(screen.getByRole("link", { name: "Textarea" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=textarea",
    );
    expect(screen.getByRole("heading", { name: "Textarea" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Outline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Filled" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma text styles" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Figma tokens" })).toBeInTheDocument();
    expect(screen.getAllByText("주제").length).toBeGreaterThan(0);
  });
});
