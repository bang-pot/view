import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio } from "@/shared/ui/Radio";

afterEach(() => {
  cleanup();
});

describe("Radio", () => {
  it("renders label and supports checked changes", () => {
    const handleChange = vi.fn();

    render(<Radio label="라벨" name="test-radio" onChange={handleChange} />);

    const radio = screen.getByRole("radio", { name: "라벨" });

    fireEvent.click(radio);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("supports checked and disabled states", () => {
    render(<Radio checked disabled label="라벨" name="test-radio" onChange={() => undefined} />);

    const radio = screen.getByRole("radio", { name: "라벨" });

    expect(radio).toBeChecked();
    expect(radio).toBeDisabled();
  });
});
