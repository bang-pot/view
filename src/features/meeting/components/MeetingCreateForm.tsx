"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { IconButton } from "@/shared/ui/IconButton";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import type { SegmentedControlItem } from "@/shared/ui/SegmentedControl";
import { Textarea } from "@/shared/ui/Textarea";
import { TextField } from "@/shared/ui/TextField";

import { MeetingCreateAccordionSection } from "./MeetingCreateAccordionSection";
import { MeetingCreateCostContactSection } from "./MeetingCreateCostContactSection";
import { MeetingCreateDateTimeFields } from "./MeetingCreateDateTimeFields";
import type {
  MeetingEditorFormValues,
  MeetingProgressStatusDraft,
  MeetingRecruitmentStatusDraft,
} from "./MeetingEditorForm";
import controlStyles from "./MeetingCreateFormControls.module.css";
import styles from "./MeetingCreatePageClient.module.css";

type MeetingCreateFormProps = {
  values: MeetingEditorFormValues;
  onChange: <TField extends keyof MeetingEditorFormValues>(
    field: TField,
    value: MeetingEditorFormValues[TField],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  cancelHref: string;
};

const MIN_CAPACITY = 2;
const MAX_CAPACITY = 8;
const DESCRIPTION_MAX_LENGTH = 500;
const RECRUITMENT_STATUS_OPTIONS: SegmentedControlItem[] = [
  { label: "모집 중", value: "recruiting" },
  { label: "마감", value: "closed" },
];
const MEETING_STATUS_OPTIONS: SegmentedControlItem[] = [
  { label: "예정", value: "scheduled" },
  { label: "완료", value: "completed" },
  { label: "취소", value: "cancelled" },
];

type FormSectionId = "theme" | "info";

const INITIAL_OPEN_SECTIONS: Record<FormSectionId, boolean> = {
  theme: true,
  info: true,
};

function isRecruitmentStatus(value: string): value is MeetingRecruitmentStatusDraft {
  return value === "recruiting" || value === "closed";
}

function isMeetingStatus(value: string): value is MeetingProgressStatusDraft {
  return value === "scheduled" || value === "completed" || value === "cancelled";
}

export function MeetingCreateForm({
  values,
  onChange,
  onSubmit,
  errorMessage,
  isSubmitting,
  submitLabel,
  cancelHref,
}: MeetingCreateFormProps) {
  const [openSections, setOpenSections] = useState(INITIAL_OPEN_SECTIONS);

  function handleAccordionToggle(sectionId: FormSectionId) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function handleCapacityStep(direction: "decrease" | "increase") {
    const parsedCapacity = Number(values.capacity);
    const currentCapacity = Number.isFinite(parsedCapacity) ? parsedCapacity : MIN_CAPACITY;
    const delta = direction === "increase" ? 1 : -1;
    const nextCapacity = Math.min(Math.max(currentCapacity + delta, MIN_CAPACITY), MAX_CAPACITY);

    onChange("capacity", String(nextCapacity));
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <MeetingCreateAccordionSection
        bodyId="meeting-theme-section-body"
        headingId="meeting-theme-section"
        isOpen={openSections.theme}
        title="테마 설정"
        onToggle={() => handleAccordionToggle("theme")}
      >
        <TextField
          aria-label="테마 선택"
          className={controlStyles.fullField}
          helperText="Helper text"
          id="meeting-theme-name"
          label="테마 선택 *"
          placeholder="Placeholder"
          trailingIcon={<span aria-hidden="true" className={controlStyles.themePickerIcon} />}
          value={values.themeName}
          onChange={(event) => onChange("themeName", event.target.value)}
        />
        <p className={controlStyles.supportingText}>등록된 방탈출 테마 중에서만 선택할 수 있어요.</p>

        <MeetingCreateDateTimeFields values={values} onChange={onChange} />

        <div className={controlStyles.capacityBlock}>
          <label htmlFor="meeting-capacity">정원 *</label>
          <div className={controlStyles.capacityControl}>
            <IconButton
              aria-label="정원 줄이기"
              className={controlStyles.stepperButton}
              size="sm"
              variant="background"
              onClick={() => handleCapacityStep("decrease")}
            >
              -
            </IconButton>
            <span className={controlStyles.capacityValue}>
              <input
                id="meeting-capacity"
                aria-label="정원"
                inputMode="numeric"
                min={MIN_CAPACITY}
                max={MAX_CAPACITY}
                type="number"
                value={values.capacity}
                onChange={(event) => onChange("capacity", event.target.value)}
              />
              <span>명</span>
            </span>
            <IconButton
              aria-label="정원 늘리기"
              className={controlStyles.stepperButton}
              size="sm"
              variant="background"
              onClick={() => handleCapacityStep("increase")}
            >
              +
            </IconButton>
          </div>
          <small>최소 2명 · 최대 8명</small>
        </div>
      </MeetingCreateAccordionSection>

      <MeetingCreateAccordionSection
        bodyId="meeting-info-section-body"
        headingId="meeting-info-section"
        isOpen={openSections.info}
        title="모임 정보"
        onToggle={() => handleAccordionToggle("info")}
      >
        <TextField
          aria-label="모집 제목"
          className={controlStyles.fullField}
          helperText="최소 2자, 최대 30자"
          id="meeting-title"
          label="모집 제목 *"
          maxLength={30}
          placeholder="모집 제목을 입력해주세요 (2~30자)"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
        />

        <fieldset className={styles.radioGroup}>
          <legend>모집 상태</legend>
          <span>모집 상태 변경하기</span>
          <SegmentedControl
            ariaLabel="모집 상태"
            className={controlStyles.compactSegmented}
            items={RECRUITMENT_STATUS_OPTIONS}
            value={values.recruitmentStatus}
            onValueChange={(value) => {
              if (isRecruitmentStatus(value)) {
                onChange("recruitmentStatus", value);
              }
            }}
          />
        </fieldset>

        <fieldset className={styles.radioGroup}>
          <legend>모임 상태</legend>
          <span>모임 상태 변경하기</span>
          <SegmentedControl
            ariaLabel="모임 상태"
            className={controlStyles.compactSegmented}
            items={MEETING_STATUS_OPTIONS}
            value={values.meetingStatus}
            onValueChange={(value) => {
              if (isMeetingStatus(value)) {
                onChange("meetingStatus", value);
              }
            }}
          />
        </fieldset>

        <Textarea
          aria-label="모임 설명"
          className={controlStyles.descriptionTextarea}
          footerText="텍스트"
          helperText="최대 500자"
          id="meeting-description"
          label="모임 설명"
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder="일정, 주의사항, 오픈채팅 안내 등을 자유롭게 적어주세요."
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </MeetingCreateAccordionSection>

      <MeetingCreateCostContactSection
        values={values}
        onChange={onChange}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        cancelHref={cancelHref}
      />
    </form>
  );
}
