import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, ICON_SRC, type IconName } from "@/shared/ui/Icon";

const EXPECTED_ICON_SRC: Record<IconName, string> = {
  calendar: "/icons/calendar.svg",
  crew: "/icons/crew.svg",
  down: "/icons/down.svg",
  home: "/icons/home.svg",
  left: "/icons/left.svg",
  log: "/icons/log.svg",
  minus: "/icons/minus.svg",
  mypage: "/icons/mypage.svg",
  people: "/icons/people.svg",
  plus: "/icons/plus.svg",
  right: "/icons/right.svg",
  up: "/icons/up.svg",
};

describe("Icon", () => {
  it("registers the design icon asset paths by name", () => {
    expect(ICON_SRC).toEqual(EXPECTED_ICON_SRC);
  });

  it("renders an accessible icon image by name", () => {
    render(<Icon name="home" alt="홈" />);

    expect(screen.getByRole("img", { name: "홈" })).toHaveAttribute("src", "/icons/home.svg");
  });

  it("can render decorative icons", () => {
    render(<Icon name="plus" decorative data-testid="icon" />);

    const icon = screen.getByTestId("icon");
    expect(icon).toHaveAttribute("src", "/icons/plus.svg");
    expect(icon).toHaveAttribute("alt", "");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
