import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UiPlaygroundPage from "@/app/playground/ui/page";

afterEach(() => {
  cleanup();
});

describe("UiPlaygroundPage selection control tabs", () => {
  it("renders the checkbox tab", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "checkbox" } }));

    expect(screen.getByRole("link", { name: "Checkbox" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=checkbox",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Checkbox" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Checkbox" })).toBeInTheDocument();
  });

  it("renders the radio tab", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "radio" } }));

    expect(screen.getByRole("link", { name: "Radio" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=radio",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Radio" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Radio" })).toBeInTheDocument();
  });

  it("renders the switch box tab", async () => {
    render(await UiPlaygroundPage({ searchParams: { tab: "switch-box" } }));

    expect(screen.getByRole("link", { name: "Switch Box" })).toHaveAttribute(
      "href",
      "/playground/ui?tab=switch-box",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Switch Box" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Switch Box" })).toBeInTheDocument();
    expect(screen.getAllByText("라벨").length).toBeGreaterThan(0);
  });
});
