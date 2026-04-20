import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SwitchBox } from "@/shared/ui/SwitchBox";

afterEach(() => {
  cleanup();
});

describe("SwitchBox", () => {
  it("uses a valid token-backed track width", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const cssPath = resolve(currentDir, "../../shared/ui/SwitchBox.module.css");
    const css = readFileSync(cssPath, "utf8");

    expect(css).not.toContain("width: var(--space-22);");
    expect(css).toContain("width: calc(var(--space-10) + var(--space-12));");
  });

  it("renders label and supports checked changes", () => {
    const handleChange = vi.fn();

    render(<SwitchBox label="라벨" onChange={handleChange} />);

    const switchInput = screen.getByRole("checkbox", { name: "라벨" });

    fireEvent.click(switchInput);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("supports checked and disabled states", () => {
    render(<SwitchBox checked disabled label="라벨" onChange={() => undefined} />);

    const switchInput = screen.getByRole("checkbox", { name: "라벨" });

    expect(switchInput).toBeChecked();
    expect(switchInput).toBeDisabled();
  });
});
