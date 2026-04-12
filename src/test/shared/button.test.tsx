import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/shared/ui/Button";

describe("Button", () => {
  it("renders the figma variants and sizes as project button primitives", () => {
    render(
      <>
        <Button size="sm" variant="primary">
          Primary button
        </Button>
        <Button size="md" variant="secondary">
          Secondary button
        </Button>
        <Button size="lg" variant="ghost">
          Ghost button
        </Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Primary button" })).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("button", { name: "Primary button" })).toHaveAttribute(
      "data-variant",
      "primary",
    );
    expect(screen.getByRole("button", { name: "Secondary button" })).toHaveAttribute(
      "data-variant",
      "secondary",
    );
    expect(screen.getByRole("button", { name: "Ghost button" })).toHaveAttribute("data-size", "lg");
  });

  it("supports icon slots and disabled state", () => {
    render(
      <Button
        disabled
        leftIcon={<span aria-hidden="true">L</span>}
        rightIcon={<span aria-hidden="true">R</span>}
      >
        Icon button
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Icon button" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-state", "disabled");
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });
});
