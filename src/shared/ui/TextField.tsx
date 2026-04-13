"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";

import styles from "./TextField.module.css";

type TextFieldVariant = "outline" | "filled";
type TextFieldVisualState = "default" | "focused" | "error" | "disabled";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  errorMessage?: string;
  hasError?: boolean;
  helperText?: string;
  label: string;
  trailingIcon?: ReactNode;
  variant?: TextFieldVariant;
  visualState?: TextFieldVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function TextField({
  className,
  disabled,
  errorMessage,
  hasError = false,
  helperText,
  id,
  label,
  onBlur,
  onFocus,
  trailingIcon,
  variant = "outline",
  visualState = "default",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const supportingId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id ?? generatedId;
  const showError = !disabled && (hasError || visualState === "error");
  const resolvedState: TextFieldVisualState = disabled
    ? "disabled"
    : showError
      ? "error"
      : isFocused || visualState === "focused"
        ? "focused"
        : "default";
  const supportingText = resolvedState === "error" ? errorMessage : helperText;

  return (
    <div className={cx(styles.root, className)} data-state={resolvedState} data-variant={variant}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          {...props}
          aria-describedby={supportingText ? supportingId : undefined}
          className={styles.input}
          data-icon={trailingIcon ? "trailing" : "none"}
          data-state={resolvedState}
          data-variant={variant}
          disabled={disabled}
          id={inputId}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
        />
        {trailingIcon ? <span className={styles.icon}>{trailingIcon}</span> : null}
      </div>
      {supportingText ? (
        <p className={styles.supportingText} id={supportingId}>
          {supportingText}
        </p>
      ) : null}
    </div>
  );
}
