import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconButton } from "@/shared/ui/IconButton";

describe("IconButton", () => {
  it("renders icon button variants and sizes", () => {
    render(
      <>
        <IconButton aria-label="Normal small icon button" size="sm" variant="normal">
          <span aria-hidden="true">P</span>
        </IconButton>
        <IconButton aria-label="Background medium icon button" size="md" variant="background">
          <span aria-hidden="true">S</span>
        </IconButton>
        <IconButton aria-label="Outline large icon button" size="lg" variant="outline">
          <span aria-hidden="true">G</span>
        </IconButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Normal small icon button" })).toHaveAttribute(
      "data-size",
      "sm",
    );
    expect(screen.getByRole("button", { name: "Normal small icon button" })).toHaveAttribute(
      "data-variant",
      "normal",
    );
    expect(screen.getByRole("button", { name: "Background medium icon button" })).toHaveAttribute(
      "data-size",
      "md",
    );
    expect(screen.getByRole("button", { name: "Outline large icon button" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
  });

  it("supports visual state preview and disabled state", () => {
    render(
      <>
        <IconButton aria-label="Focused icon button" variant="background" visualState="focused">
          <span aria-hidden="true">I</span>
        </IconButton>
        <IconButton aria-label="Disabled icon button" disabled>
          <span aria-hidden="true">D</span>
        </IconButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Focused icon button" })).toHaveAttribute(
      "data-state",
      "focused",
    );
    expect(screen.getByRole("button", { name: "Disabled icon button" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Disabled icon button" })).toHaveAttribute(
      "data-state",
      "disabled",
    );
  });
});
