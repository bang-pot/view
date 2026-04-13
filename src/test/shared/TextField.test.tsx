import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TextField } from "@/shared/ui/TextField";

afterEach(() => {
  cleanup();
});

describe("TextField", () => {
  it("renders label, helper text, trailing icon, and outline metadata", () => {
    render(
      <TextField
        helperText="Helper text"
        label="Label"
        placeholder="Placeholder"
        trailingIcon={<span aria-hidden="true">I</span>}
        variant="outline"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Label" });

    expect(input).toHaveAttribute("data-variant", "outline");
    expect(input).toHaveAttribute("data-icon", "trailing");
    expect(screen.getByText("Helper text")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("supports actual typing and error / disabled states", () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <TextField
        label="Label"
        onChange={handleChange}
        placeholder="Placeholder"
        value=""
      />,
    );

    const input = screen.getByRole("textbox", { name: "Label" });

    fireEvent.change(input, { target: { value: "Input value" } });

    expect(handleChange).toHaveBeenCalledTimes(1);

    rerender(
      <TextField
        errorMessage="Error message"
        hasError
        label="Label"
        placeholder="Placeholder"
        value="Input value"
      />,
    );

    const errorInput = screen.getByRole("textbox", { name: "Label" });

    expect(errorInput).toHaveAttribute("data-state", "error");
    expect(screen.getByText("Error message")).toBeInTheDocument();

    rerender(
      <TextField
        disabled
        helperText="Helper text"
        label="Label"
        placeholder="Placeholder"
        value=""
      />,
    );

    const disabledInput = screen.getByRole("textbox", { name: "Label" });

    expect(disabledInput).toBeDisabled();
    expect(disabledInput).toHaveAttribute("data-state", "disabled");
  });
});
