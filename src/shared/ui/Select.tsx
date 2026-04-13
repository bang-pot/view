"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { useId, useState } from "react";

import styles from "./Select.module.css";

type SelectVariant = "outline";
type SelectVisualState = "default" | "hover" | "focused" | "open" | "error" | "disabled";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  errorMessage?: string;
  hasError?: boolean;
  helperText?: string;
  label: string;
  options: SelectOption[];
  trailingIcon?: ReactNode;
  variant?: SelectVariant;
  visualState?: SelectVisualState;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function DefaultChevron({ color = "#a3a3a3" }: { color?: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6.5L8 10L12 6.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Select({
  className,
  disabled,
  errorMessage,
  hasError = false,
  helperText,
  id,
  label,
  onBlur,
  onFocus,
  options,
  trailingIcon,
  variant = "outline",
  visualState = "default",
  ...props
}: SelectProps) {
  const generatedId = useId();
  const supportingId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const selectId = id ?? generatedId;
  const showError = !disabled && (hasError || visualState === "error");
  const resolvedState: SelectVisualState = disabled
    ? "disabled"
    : showError
      ? "error"
      : isFocused || visualState === "focused" || visualState === "open"
        ? visualState === "open"
          ? "open"
          : "focused"
        : visualState === "hover"
          ? "hover"
          : "default";
  const supportingText = resolvedState === "error" ? errorMessage : helperText;

  const icon =
    trailingIcon ??
    (resolvedState === "error" ? (
      <DefaultChevron color="#f5494a" />
    ) : resolvedState === "disabled" ? (
      <DefaultChevron color="#d4d4d4" />
    ) : (
      <DefaultChevron color="#a3a3a3" />
    ));

  return (
    <div className={cx(styles.root, className)} data-state={resolvedState} data-variant={variant}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <div className={styles.control}>
        <select
          {...props}
          aria-describedby={supportingText ? supportingId : undefined}
          className={styles.select}
          data-state={resolvedState}
          data-variant={variant}
          disabled={disabled}
          id={selectId}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.icon}>{icon}</span>
      </div>
      {supportingText ? (
        <p className={styles.supportingText} id={supportingId}>
          {supportingText}
        </p>
      ) : null}
    </div>
  );
}
