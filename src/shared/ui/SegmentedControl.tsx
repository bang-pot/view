"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useMemo, useState } from "react";

import styles from "./SegmentedControl.module.css";

export type SegmentedControlItem = {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  value: string;
};

type SegmentedControlProps = HTMLAttributes<HTMLDivElement> & {
  ariaLabel: string;
  defaultValue?: string;
  items: SegmentedControlItem[];
  onValueChange?: (value: string) => void;
  value?: string;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function SegmentedControl({
  ariaLabel,
  className,
  defaultValue,
  items,
  onValueChange,
  value,
  ...props
}: SegmentedControlProps) {
  const firstEnabledValue = useMemo(
    () => items.find((item) => !item.disabled)?.value,
    [items],
  );
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabledValue);
  const selectedValue = value ?? internalValue ?? firstEnabledValue;

  function handleSelect(nextValue: string, disabled?: boolean) {
    if (disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <div
      {...props}
      aria-label={ariaLabel}
      className={cx(styles.root, className)}
      role="radiogroup"
    >
      {items.map((item) => {
        const isSelected = item.value === selectedValue;
        const state = item.disabled ? "disabled" : isSelected ? "selected" : "unselected";
        const type = item.icon ? "icon-text" : "text-only";

        return (
          <button
            key={item.value}
            aria-checked={isSelected}
            className={styles.item}
            data-state={state}
            data-type={type}
            disabled={item.disabled}
            onClick={() => handleSelect(item.value, item.disabled)}
            role="radio"
            type="button"
          >
            {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
