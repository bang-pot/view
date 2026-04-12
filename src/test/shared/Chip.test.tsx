import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "@/shared/ui/Chip";

describe("Chip", () => {
  it("renders normal and solid variants across sizes", () => {
    render(
      <>
        <Chip size="lg" variant="normal">
          Large normal chip
        </Chip>
        <Chip size="md" variant="solid">
          Medium solid chip
        </Chip>
        <Chip size="sm" variant="normal">
          Small normal chip
        </Chip>
      </>,
    );

    const largeChip = screen.getByText("Large normal chip").closest("[data-size]");
    const mediumChip = screen.getByText("Medium solid chip").closest("[data-size]");
    const smallChip = screen.getByText("Small normal chip").closest("[data-size]");

    expect(largeChip).toHaveAttribute("data-size", "lg");
    expect(largeChip).toHaveAttribute("data-variant", "normal");
    expect(mediumChip).toHaveAttribute("data-variant", "solid");
    expect(smallChip).toHaveAttribute("data-size", "sm");
  });

  it("supports icon + text and visual state previews", () => {
    render(
      <>
        <Chip leftIcon={<span aria-hidden="true">I</span>} visualState="focused">
          Focused chip
        </Chip>
        <Chip disabled leftIcon={<span aria-hidden="true">D</span>} variant="solid">
          Disabled chip
        </Chip>
      </>,
    );

    const focusedChip = screen.getByText("Focused chip").closest("[data-type]");
    const disabledChip = screen.getByText("Disabled chip").closest("[data-type]");

    expect(focusedChip).toHaveAttribute("data-type", "icon-text");
    expect(focusedChip).toHaveAttribute("data-state", "focused");
    expect(disabledChip).toHaveAttribute("data-state", "disabled");
    expect(disabledChip).toHaveAttribute("data-variant", "solid");
  });
});
