import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Textarea } from "@/shared/ui/Textarea";

afterEach(() => {
  cleanup();
});

describe("Textarea", () => {
  it("renders label, helper text, footer text, and count metadata", () => {
    render(
      <Textarea
        footerText="텍스트"
        helperText="메시지에 바티코를 적어요."
        label="주제"
        maxLength={2000}
        placeholder="내용을 입력해주세요."
        value="sample"
        variant="outline"
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "주제" });

    expect(textarea).toHaveAttribute("data-variant", "outline");
    expect(screen.getByText("메시지에 바티코를 적어요.")).toBeInTheDocument();
    expect(screen.getByText("텍스트")).toBeInTheDocument();
    expect(screen.getByText("6/2000")).toBeInTheDocument();
  });

  it("supports actual typing and error / disabled states", () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <Textarea
        label="주제"
        maxLength={2000}
        onChange={handleChange}
        placeholder="내용을 입력해주세요."
        value=""
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "주제" });

    fireEvent.change(textarea, { target: { value: "새 내용" } });

    expect(handleChange).toHaveBeenCalledTimes(1);

    rerender(
      <Textarea
        errorMessage="메시지에 바티코를 적어요."
        hasError
        label="주제"
        maxLength={2000}
        placeholder="내용을 입력해주세요."
        value="입력값"
      />,
    );

    const errorTextarea = screen.getByRole("textbox", { name: "주제" });

    expect(errorTextarea).toHaveAttribute("data-state", "error");
    expect(screen.getByText("메시지에 바티코를 적어요.")).toBeInTheDocument();

    rerender(
      <Textarea
        disabled
        helperText="메시지에 바티코를 적어요."
        label="주제"
        maxLength={2000}
        placeholder="내용을 입력해주세요."
        value=""
      />,
    );

    const disabledTextarea = screen.getByRole("textbox", { name: "주제" });

    expect(disabledTextarea).toBeDisabled();
    expect(disabledTextarea).toHaveAttribute("data-state", "disabled");
  });
});
