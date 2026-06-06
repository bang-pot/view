"use client";

import Link from "next/link";
import { useState } from "react";

import { MeetingCreateAccordionSection } from "./MeetingCreateAccordionSection";
import type { MeetingCostMode, MeetingEditorFormValues } from "./MeetingEditorForm";
import sectionStyles from "./MeetingCreateCostContactSection.module.css";
import styles from "./MeetingCreatePageClient.module.css";

type MeetingCreateCostContactSectionProps = {
  values: MeetingEditorFormValues;
  onChange: <TField extends keyof MeetingEditorFormValues>(
    field: TField,
    value: MeetingEditorFormValues[TField],
  ) => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  cancelHref: string;
};

const DEFAULT_PER_PERSON_PRICE = 25000;
const FALLBACK_CAPACITY = 4;
const COST_MODE_OPTIONS = [
  {
    description: "참여자 수에 관계없이 각자 n원씩 냅니다.",
    label: "1인당 가격",
    value: "PER_PERSON",
  },
  {
    description: "총 비용을 인원 수로 나눠 계산합니다.",
    label: "1회 총 가격",
    value: "TOTAL",
  },
] as const;

type CostContactSectionId = "cost" | "contact";

const INITIAL_OPEN_SECTIONS: Record<CostContactSectionId, boolean> = {
  cost: true,
  contact: true,
};

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseCapacity(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return FALLBACK_CAPACITY;
  }

  return parsed;
}

function buildCostPreview(values: MeetingEditorFormValues, costMode: MeetingCostMode) {
  const capacity = parseCapacity(values.capacity);
  const inputCost = parsePositiveNumber(values.totalCost);
  const perPersonInputCost = inputCost ?? DEFAULT_PER_PERSON_PRICE;
  const totalCost =
    costMode === "PER_PERSON"
      ? perPersonInputCost * capacity
      : inputCost ?? DEFAULT_PER_PERSON_PRICE * capacity;
  const perPersonCost = Math.floor(totalCost / capacity);

  return {
    perPersonText: `1인당 ${formatWon(perPersonCost)}`,
    totalText: `현재 ${capacity}명 기준 총 ${formatWon(totalCost)} 이상`,
  };
}

export function MeetingCreateCostContactSection({
  values,
  onChange,
  errorMessage,
  isSubmitting,
  submitLabel,
  cancelHref,
}: MeetingCreateCostContactSectionProps) {
  const [openSections, setOpenSections] = useState(INITIAL_OPEN_SECTIONS);
  const costPreview = buildCostPreview(values, values.costMode);

  function handleAccordionToggle(sectionId: CostContactSectionId) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  return (
    <>
      <MeetingCreateAccordionSection
        bodyId="meeting-cost-section-body"
        headingId="meeting-cost-section"
        isOpen={openSections.cost}
        title="비용"
        onToggle={() => handleAccordionToggle("cost")}
      >
        <div className={styles.groupLabel}>비용 방식</div>
        <div className={sectionStyles.costModeGrid} aria-label="비용 방식">
          {COST_MODE_OPTIONS.map((option) => {
            const isSelected = option.value === values.costMode;
            const className = isSelected
              ? `${sectionStyles.costModeCard} ${sectionStyles.costModeCardActive}`
              : sectionStyles.costModeCard;

            return (
              <button
                aria-label={option.label}
                aria-pressed={isSelected}
                className={className}
                key={option.value}
                type="button"
                onClick={() => onChange("costMode", option.value)}
              >
                <span aria-hidden="true" className={sectionStyles.radioDot} />
                <span className={sectionStyles.costModeText}>
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <label className={styles.field} htmlFor="meeting-total-cost">
          <span>금액</span>
          <input
            id="meeting-total-cost"
            aria-label="금액"
            min="0"
            placeholder="예) 25000"
            type="number"
            value={values.totalCost}
            onChange={(event) => onChange("totalCost", event.target.value)}
          />
          <small>0원 초과 숫자만 입력</small>
        </label>
        <div className={sectionStyles.costPreview}>
          <strong>{costPreview.perPersonText}</strong>
          <span>{costPreview.totalText}</span>
        </div>
      </MeetingCreateAccordionSection>

      <MeetingCreateAccordionSection
        bodyId="meeting-contact-section-body"
        headingId="meeting-contact-section"
        isOpen={openSections.contact}
        title="연락 링크"
        onToggle={() => handleAccordionToggle("contact")}
      >
        <label className={styles.field} htmlFor="meeting-contact-link">
          <span>오픈채팅 또는 연락 링크</span>
          <input
            id="meeting-contact-link"
            aria-label="오픈채팅 또는 연락 링크"
            placeholder="https://open.kakao.com/..."
            value={values.contactLink}
            onChange={(event) => onChange("contactLink", event.target.value)}
          />
          <small>URL 형식만 입력 가능</small>
        </label>
      </MeetingCreateAccordionSection>

      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      <div className={sectionStyles.actions}>
        <Link className={sectionStyles.cancelButton} href={cancelHref}>
          취소
        </Link>
        <button className={sectionStyles.submitButton} type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
    </>
  );
}
