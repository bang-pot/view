import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Checkbox } from "@/shared/ui/Checkbox";

afterEach(() => {
  cleanup();
});

describe("Checkbox", () => {
  it("renders label and supports checked changes", () => {
    const handleChange = vi.fn();

    render(<Checkbox label="라벨" onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "라벨" });

    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("supports checked and disabled states", () => {
    render(<Checkbox checked disabled label="라벨" onChange={() => undefined} />);

    const checkbox = screen.getByRole("checkbox", { name: "라벨" });

    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });
});
