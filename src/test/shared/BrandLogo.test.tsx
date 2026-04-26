import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "@/shared/ui/BrandLogo";

describe("BrandLogo", () => {
  it("renders the horizontal BangPot logo by default", () => {
    render(<BrandLogo />);

    const logo = screen.getByRole("img", { name: "BangPot" });

    expect(logo).toHaveAttribute("src", "/brand/bangpot-logo-horizontal.svg");
    expect(logo).toHaveAttribute("data-variant", "horizontal");
  });

  it("supports stacked, symbol, and decorative variants", () => {
    render(
      <>
        <BrandLogo variant="stacked" alt="BangPot stacked" />
        <BrandLogo variant="symbol" decorative />
      </>,
    );

    expect(screen.getByRole("img", { name: "BangPot stacked" })).toHaveAttribute(
      "src",
      "/brand/bangpot-logo-stacked.svg",
    );
    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "src",
      "/brand/bangpot-symbol.svg",
    );
  });
});
