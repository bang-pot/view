import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SwitchBox } from "@/shared/ui/SwitchBox";

afterEach(() => {
  cleanup();
});

describe("SwitchBox", () => {
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
