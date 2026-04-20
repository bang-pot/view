import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";

afterEach(() => {
  cleanup();
});

describe("SegmentedControl", () => {
  const items = [
    { label: "텍스트", value: "first" },
    { label: "텍스트", value: "second" },
    { disabled: true, label: "텍스트", value: "third" },
  ];

  it("uses tighter horizontal container padding to avoid trailing empty space", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const cssPath = resolve(currentDir, "../../shared/ui/SegmentedControl.module.css");
    const css = readFileSync(cssPath, "utf8");

    expect(css).not.toContain("padding: var(--space-2);");
    expect(css).toContain("padding: var(--space-2) var(--space-1);");
    expect(css).toContain("width: fit-content;");
    expect(css).toContain('.item[data-type="text-only"] {');
  });

  it("renders items and supports uncontrolled selection changes", () => {
    const handleValueChange = vi.fn();

    render(
      <SegmentedControl
        ariaLabel="텍스트만 세그먼트"
        defaultValue="first"
        items={items}
        onValueChange={handleValueChange}
      />,
    );

    const firstItem = screen.getByRole("radio", { name: "텍스트", checked: true });
    const secondItem = screen.getAllByRole("radio", { name: "텍스트" })[1];

    expect(firstItem).toHaveAttribute("data-state", "selected");
    expect(firstItem).toHaveAttribute("data-type", "text-only");
    expect(secondItem).toHaveAttribute("data-state", "unselected");

    fireEvent.click(secondItem);

    expect(handleValueChange).toHaveBeenCalledWith("second");
    expect(secondItem).toHaveAttribute("aria-checked", "true");
  });

  it("does not change selection when a disabled item is clicked", () => {
    const handleValueChange = vi.fn();

    render(
      <SegmentedControl
        ariaLabel="비활성 세그먼트"
        defaultValue="first"
        items={items}
        onValueChange={handleValueChange}
      />,
    );

    const disabledItem = screen.getAllByRole("radio", { name: "텍스트" })[2];

    fireEvent.click(disabledItem);

    expect(disabledItem).toHaveAttribute("data-state", "disabled");
    expect(disabledItem).toHaveAttribute("data-type", "text-only");
    expect(disabledItem).toHaveAttribute("aria-checked", "false");
    expect(handleValueChange).not.toHaveBeenCalled();
  });
});
