import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./IconButton.module.css";

type IconButtonVariant = "normal" | "background" | "outline";
type IconButtonSize = "sm" | "md" | "lg";
type IconButtonVisualState = "default" | "hover" | "focused" | "pressed" | "disabled";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  visualState?: IconButtonVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function IconButton({
  children,
  className,
  disabled,
  size = "sm",
  variant = "normal",
  visualState = "default",
  ...props
}: IconButtonProps) {
  const resolvedState = disabled ? "disabled" : visualState;

  return (
    <button
      {...props}
      className={cx(styles.button, styles[variant], styles[size], className)}
      data-size={size}
      data-state={resolvedState}
      data-variant={variant}
      disabled={disabled}
      type={props.type ?? "button"}
    >
      <span className={styles.iconWrapper}>
        <span className={styles.icon}>{children}</span>
      </span>
    </button>
  );
}
