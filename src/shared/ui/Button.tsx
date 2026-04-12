import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonVisualState = "default" | "hover" | "pressed" | "disabled";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  visualState?: ButtonVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  disabled,
  leftIcon,
  rightIcon,
  size = "sm",
  variant = "primary",
  visualState = "default",
  ...props
}: ButtonProps) {
  const resolvedState = disabled ? "disabled" : visualState;

  return (
    <button
      {...props}
      className={cx(styles.button, styles[variant], styles[size], className)}
      data-size={size}
      data-state={resolvedState}
      data-variant={variant}
      disabled={disabled}
    >
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
