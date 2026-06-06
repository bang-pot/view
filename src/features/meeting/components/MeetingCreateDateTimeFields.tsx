import { useState } from "react";

import { TextField } from "@/shared/ui/TextField";

import type { MeetingEditorFormValues } from "./MeetingEditorForm";
import controlStyles from "./MeetingCreateFormControls.module.css";
import styles from "./MeetingCreatePageClient.module.css";

type MeetingCreateDateTimeFieldsProps = {
  readonly values: MeetingEditorFormValues;
  readonly onChange: <TField extends keyof MeetingEditorFormValues>(
    field: TField,
    value: MeetingEditorFormValues[TField],
  ) => void;
};

export function normalizeMeetingTimeInput(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const timeParts = trimmed.includes(":") || trimmed.includes(".") || /\s/.test(trimmed)
    ? splitDelimitedTime(trimmed)
    : splitCompactTime(trimmed);

  if (timeParts === null) {
    return null;
  }

  const [hoursText, minutesText] = timeParts;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function splitDelimitedTime(value: string): readonly [string, string] | null {
  const parts = value.replace(/[.\s]/g, ":").split(":");

  if (parts.length !== 2) {
    return null;
  }

  const [hoursText, minutesText] = parts;

  if (!hoursText || !minutesText || !/^\d{1,2}$/.test(hoursText) || !/^\d{1,2}$/.test(minutesText)) {
    return null;
  }

  return [hoursText, minutesText];
}

function splitCompactTime(value: string): readonly [string, string] | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return [digits, "00"];
  }

  if (digits.length === 3) {
    return [digits.slice(0, 1), digits.slice(1)];
  }

  if (digits.length === 4) {
    return [digits.slice(0, 2), digits.slice(2)];
  }

  return null;
}

export function MeetingCreateDateTimeFields({ values, onChange }: MeetingCreateDateTimeFieldsProps) {
  const [hasBlurredTime, setHasBlurredTime] = useState(false);
  const normalizedTime = normalizeMeetingTimeInput(values.time);
  const hasTimeError = hasBlurredTime && values.time.trim().length > 0 && normalizedTime === null;

  return (
    <>
      <div className={styles.groupLabel}>날짜 · 시간 *</div>
      <div className={styles.twoColumn}>
        <TextField
          aria-label="날짜"
          className={controlStyles.fullField}
          helperText="날짜를 선택해 주세요"
          id="meeting-date"
          label="날짜"
          type="date"
          value={values.date}
          onChange={(event) => onChange("date", event.target.value)}
        />
        <TextField
          aria-label="시간"
          className={controlStyles.fullField}
          errorMessage="올바른 시간을 입력해 주세요"
          hasError={hasTimeError}
          helperText="예) 19:00, 1930, 19.30"
          id="meeting-time"
          inputMode="numeric"
          label="시간"
          placeholder="HH:MM"
          value={values.time}
          onBlur={() => {
            setHasBlurredTime(true);

            if (normalizedTime !== null) {
              onChange("time", normalizedTime);
            }
          }}
          onChange={(event) => onChange("time", event.target.value)}
        />
      </div>
    </>
  );
}
