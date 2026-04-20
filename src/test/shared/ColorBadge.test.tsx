import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColorBadge } from "@/shared/ui/ColorBadge";

describe("ColorBadge", () => {
  it("uses a dedicated text color for outline badges", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const cssPath = resolve(currentDir, "../../shared/ui/ColorBadge.module.css");
    const css = readFileSync(cssPath, "utf8");

    expect(css).toContain("color: var(--badge-text-color);");
    expect(css).toContain("--badge-solid-color:");
    expect(css).toContain("--badge-outline-color:");
    expect(css).toContain(".outline {");
  });

  it("renders solid and outline variants across sizes and colors", () => {
    render(
      <>
        <ColorBadge color="yellow" size="sm" variant="solid">
          Yellow
        </ColorBadge>
        <ColorBadge color="red" size="md" variant="outline">
          Red
        </ColorBadge>
        <ColorBadge color="blue" size="lg" variant="solid">
          Blue
        </ColorBadge>
      </>,
    );

    const yellowBadge = screen.getByText("Yellow").closest("[data-size]");
    const redBadge = screen.getByText("Red").closest("[data-size]");
    const blueBadge = screen.getByText("Blue").closest("[data-size]");

    expect(yellowBadge).toHaveAttribute("data-size", "sm");
    expect(yellowBadge).toHaveAttribute("data-variant", "solid");
    expect(yellowBadge).toHaveAttribute("data-color", "yellow");
    expect(redBadge).toHaveAttribute("data-size", "md");
    expect(redBadge).toHaveAttribute("data-variant", "outline");
    expect(redBadge).toHaveAttribute("data-color", "red");
    expect(blueBadge).toHaveAttribute("data-size", "lg");
    expect(blueBadge).toHaveAttribute("data-color", "blue");
  });
});
