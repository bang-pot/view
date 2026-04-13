"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

import styles from "./SwitchBox.module.css";

type SwitchBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function SwitchBox({ className, id, label, ...props }: SwitchBoxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={cx(styles.root, className)} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <span className={styles.control}>
        <input {...props} className={styles.input} id={inputId} type="checkbox" />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
    </label>
  );
}
