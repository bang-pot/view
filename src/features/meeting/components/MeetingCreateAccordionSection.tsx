"use client";

import type { ReactNode } from "react";

import styles from "./MeetingCreatePageClient.module.css";

type MeetingCreateAccordionSectionProps = {
  readonly bodyId: string;
  readonly children: ReactNode;
  readonly headingId: string;
  readonly isOpen: boolean;
  readonly title: string;
  readonly onToggle: () => void;
};

export function MeetingCreateAccordionSection({
  bodyId,
  children,
  headingId,
  isOpen,
  title,
  onToggle,
}: MeetingCreateAccordionSectionProps) {
  const actionLabel = isOpen ? `${title} 접기` : `${title} 펼치기`;

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 id={headingId}>{title}</h2>
        <button
          aria-controls={bodyId}
          aria-expanded={isOpen}
          aria-label={actionLabel}
          className={styles.collapseButton}
          type="button"
          onClick={onToggle}
        >
          {isOpen ? "-" : "+"}
        </button>
      </div>
      {isOpen ? (
        <div className={styles.cardBody} id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
