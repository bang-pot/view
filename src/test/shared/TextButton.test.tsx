import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextButton } from "@/shared/ui/TextButton";

describe("TextButton", () => {
  it("renders the figma text button variants with sizes", () => {
    render(
      <>
        <TextButton size="sm" variant="primary">
          Primary text button
        </TextButton>
        <TextButton size="md" variant="assist">
          Assist text button
        </TextButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Primary text button" })).toHaveAttribute(
      "data-size",
      "sm",
    );
    expect(screen.getByRole("button", { name: "Primary text button" })).toHaveAttribute(
      "data-variant",
      "primary",
    );
    expect(screen.getByRole("button", { name: "Assist text button" })).toHaveAttribute(
      "data-size",
      "md",
    );
    expect(screen.getByRole("button", { name: "Assist text button" })).toHaveAttribute(
      "data-variant",
      "assist",
    );
  });

  it("supports icon positions and disabled state", () => {
    render(
      <>
        <TextButton leftIcon={<span aria-hidden="true">L</span>}>Left text button</TextButton>
        <TextButton rightIcon={<span aria-hidden="true">R</span>} disabled>
          Disabled text button
        </TextButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Left text button" })).toHaveAttribute(
      "data-type",
      "icon-left",
    );
    expect(screen.getByRole("button", { name: "Disabled text button" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Disabled text button" })).toHaveAttribute(
      "data-state",
      "disabled",
    );
  });
});
