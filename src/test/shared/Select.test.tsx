import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Select } from "@/shared/ui/Select";

afterEach(() => {
  cleanup();
});

const options = [
  { label: "선택하세요", value: "" },
  { label: "선택됨", value: "selected" },
];

describe("Select", () => {
  it("renders label, helper text and options", () => {
    render(
      <Select
        helperText="도움말"
        label="Select"
        options={options}
        defaultValue=""
      />,
    );

    const select = screen.getByRole("combobox", { name: "Select" });

    expect(select).toHaveAttribute("data-variant", "outline");
    expect(screen.getByText("도움말")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "선택됨" })).toBeInTheDocument();
  });

  it("supports selecting values and error / disabled states", () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <Select label="Select" onChange={handleChange} options={options} value="" />,
    );

    const select = screen.getByRole("combobox", { name: "Select" });

    fireEvent.change(select, { target: { value: "selected" } });

    expect(handleChange).toHaveBeenCalledTimes(1);

    rerender(
      <Select
        errorMessage="에러 메시지"
        hasError
        label="Select"
        options={options}
        value="selected"
      />,
    );

    const errorSelect = screen.getByRole("combobox", { name: "Select" });

    expect(errorSelect).toHaveAttribute("data-state", "error");
    expect(screen.getByText("에러 메시지")).toBeInTheDocument();

    rerender(
      <Select
        disabled
        helperText="도움말"
        label="Select"
        options={options}
        value=""
      />,
    );

    const disabledSelect = screen.getByRole("combobox", { name: "Select" });

    expect(disabledSelect).toBeDisabled();
    expect(disabledSelect).toHaveAttribute("data-state", "disabled");
  });
});
