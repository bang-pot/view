import type { HTMLAttributes } from "react";

import styles from "./ColorBadge.module.css";

type ColorBadgeVariant = "solid" | "outline";
type ColorBadgeSize = "sm" | "md" | "lg";
type ColorBadgeColor = "yellow" | "red" | "blue" | "pink" | "purple" | "green";

type ColorBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color: ColorBadgeColor;
  size?: ColorBadgeSize;
  variant?: ColorBadgeVariant;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function ColorBadge({
  children,
  className,
  color,
  size = "md",
  variant = "solid",
  ...props
}: ColorBadgeProps) {
  return (
    <span
      {...props}
      className={cx(styles.badge, styles[color], styles[size], styles[variant], className)}
      data-color={color}
      data-size={size}
      data-variant={variant}
      role="status"
    >
      {children}
    </span>
  );
}
