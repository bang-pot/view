"use client";

import type { ReactNode, TextareaHTMLAttributes } from "react";
import { useId, useMemo, useState } from "react";

import styles from "./Textarea.module.css";

type TextareaVariant = "outline" | "filled";
type TextareaVisualState = "default" | "focused" | "error" | "disabled";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  errorMessage?: string;
  footerText?: ReactNode;
  hasError?: boolean;
  helperText?: string;
  label: string;
  variant?: TextareaVariant;
  visualState?: TextareaVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Textarea({
  className,
  defaultValue,
  disabled,
  errorMessage,
  footerText,
  hasError = false,
  helperText,
  id,
  label,
  maxLength,
  onBlur,
  onChange,
  onFocus,
  value,
  variant = "outline",
  visualState = "default",
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const supportingId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(
    typeof defaultValue === "string" ? defaultValue : "",
  );

  const textareaId = id ?? generatedId;
  const showError = !disabled && (hasError || visualState === "error");
  const resolvedState: TextareaVisualState = disabled
    ? "disabled"
    : showError
      ? "error"
      : isFocused || visualState === "focused"
        ? "focused"
        : "default";
  const supportingText = resolvedState === "error" ? errorMessage : helperText;
  const currentValue = typeof value === "string" ? value : uncontrolledValue;
  const countText = useMemo(() => {
    if (!maxLength) {
      return null;
    }

    return `${currentValue.length}/${maxLength}`;
  }, [currentValue, maxLength]);

  return (
    <div className={cx(styles.root, className)} data-state={resolvedState} data-variant={variant}>
      <label className={styles.label} htmlFor={textareaId}>
        {label}
      </label>
      <div className={styles.control}>
        <textarea
          {...props}
          aria-describedby={supportingText ? supportingId : undefined}
          className={styles.textarea}
          data-state={resolvedState}
          data-variant={variant}
          disabled={disabled}
          id={textareaId}
          maxLength={maxLength}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onChange={(event) => {
            if (value === undefined) {
              setUncontrolledValue(event.target.value);
            }
            onChange?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          value={value}
        />
        {countText || footerText ? (
          <div className={styles.metaRow}>
            <span>{countText}</span>
            <span>{footerText}</span>
          </div>
        ) : null}
      </div>
      {supportingText ? (
        <p className={styles.supportingText} id={supportingId}>
          {supportingText}
        </p>
      ) : null}
    </div>
  );
}
