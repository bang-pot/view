import type { ImgHTMLAttributes } from "react";

import styles from "./BrandLogo.module.css";

const LOGO_SRC = {
  horizontal: "/brand/bangpot-logo-horizontal.svg",
  stacked: "/brand/bangpot-logo-stacked.svg",
  symbol: "/brand/bangpot-symbol.svg",
} as const;

type BrandLogoVariant = keyof typeof LOGO_SRC;

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  alt?: string;
  decorative?: boolean;
  variant?: BrandLogoVariant;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function BrandLogo({
  alt = "BangPot",
  className,
  decorative = false,
  variant = "horizontal",
  ...props
}: BrandLogoProps) {
  return (
    // SVG brand assets are served directly from public/brand so they stay reusable
    // in plain markup contexts without requiring Next image sizing props.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      className={cx(styles.logo, styles[variant], className)}
      data-variant={variant}
      role={decorative ? "presentation" : undefined}
      src={LOGO_SRC[variant]}
    />
  );
}
