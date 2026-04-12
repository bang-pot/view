import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./TextButton.module.css";

type TextButtonVariant = "primary" | "assist";
type TextButtonSize = "sm" | "md";

type TextButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: TextButtonSize;
  variant?: TextButtonVariant;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function TextButton({
  children,
  className,
  disabled,
  leftIcon,
  rightIcon,
  size = "sm",
  variant = "primary",
  ...props
}: TextButtonProps) {
  const type = leftIcon ? "icon-left" : rightIcon ? "icon-right" : "text-only";
  const state = disabled ? "disabled" : "default";

  return (
    <button
      {...props}
      className={cx(styles.button, styles[variant], styles[size], className)}
      data-size={size}
      data-state={state}
      data-type={type}
      data-variant={variant}
      disabled={disabled}
      type={props.type ?? "button"}
    >
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
