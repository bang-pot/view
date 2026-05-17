import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "@/shared/ui/BrandLogo";

describe("BrandLogo", () => {
  it("renders the horizontal Banglog logo by default", () => {
    render(<BrandLogo />);

    const logo = screen.getByRole("img", { name: "Banglog" });

    expect(logo).toHaveAttribute("src", "/brand/banglog-logo-horizontal.svg");
    expect(logo).toHaveAttribute("data-variant", "horizontal");
  });

  it("supports stacked, symbol, and decorative variants", () => {
    render(
      <>
        <BrandLogo variant="stacked" alt="Banglog stacked" />
        <BrandLogo variant="symbol" decorative />
      </>,
    );

    expect(screen.getByRole("img", { name: "Banglog stacked" })).toHaveAttribute(
      "src",
      "/brand/banglog-logo-stacked.svg",
    );
    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "src",
      "/brand/banglog-symbol.svg",
    );
  });
});
