import type { HTMLAttributes, ReactNode } from "react";

import styles from "./Chip.module.css";

type ChipVariant = "normal" | "solid";
type ChipSize = "sm" | "md" | "lg";
type ChipVisualState = "default" | "hover" | "focused" | "pressed" | "disabled";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  leftIcon?: ReactNode;
  disabled?: boolean;
  size?: ChipSize;
  variant?: ChipVariant;
  visualState?: ChipVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Chip({
  children,
  className,
  disabled,
  leftIcon,
  size = "md",
  variant = "normal",
  visualState = "default",
  ...props
}: ChipProps) {
  const resolvedState = disabled ? "disabled" : visualState;
  const type = leftIcon ? "icon-text" : "text-only";

  return (
    <span
      {...props}
      className={cx(styles.chip, styles[variant], styles[size], className)}
      data-size={size}
      data-state={resolvedState}
      data-type={type}
      data-variant={variant}
      role="status"
    >
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
