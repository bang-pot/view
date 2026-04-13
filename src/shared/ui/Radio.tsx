"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

import styles from "./Radio.module.css";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Radio({ className, id, label, ...props }: RadioProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={cx(styles.root, className)} htmlFor={inputId}>
      <input {...props} className={styles.input} id={inputId} type="radio" />
      <span className={styles.indicator} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
