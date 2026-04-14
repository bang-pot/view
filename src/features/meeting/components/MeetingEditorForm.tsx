"use client";

import type { FormEvent } from "react";

export type MeetingEditorFormValues = {
  title: string;
  date: string;
  time: string;
  place: string;
  themeName: string;
  capacity: string;
  totalCost: string;
  contactLink: string;
  description: string;
};

type MeetingEditorFormProps = {
  values: MeetingEditorFormValues;
  onChange: (field: keyof MeetingEditorFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
};

export function MeetingEditorForm({
  values,
  onChange,
  onSubmit,
  errorMessage,
  isSubmitting,
  submitLabel,
}: MeetingEditorFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="meeting-title">제목</label>
      <input
        id="meeting-title"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
      />

      <label htmlFor="meeting-date">날짜</label>
      <input
        id="meeting-date"
        type="date"
        value={values.date}
        onChange={(event) => onChange("date", event.target.value)}
      />

      <label htmlFor="meeting-time">시간</label>
      <input
        id="meeting-time"
        type="time"
        value={values.time}
        onChange={(event) => onChange("time", event.target.value)}
      />

      <label htmlFor="meeting-place">장소</label>
      <input
        id="meeting-place"
        value={values.place}
        onChange={(event) => onChange("place", event.target.value)}
      />

      <label htmlFor="meeting-theme-name">테마명</label>
      <input
        id="meeting-theme-name"
        value={values.themeName}
        onChange={(event) => onChange("themeName", event.target.value)}
      />

      <label htmlFor="meeting-capacity">정원</label>
      <input
        id="meeting-capacity"
        type="number"
        min="1"
        value={values.capacity}
        onChange={(event) => onChange("capacity", event.target.value)}
      />

      <label htmlFor="meeting-total-cost">비용 안내 (총 비용)</label>
      <input
        id="meeting-total-cost"
        type="number"
        min="0"
        value={values.totalCost}
        onChange={(event) => onChange("totalCost", event.target.value)}
      />

      <label htmlFor="meeting-contact-link">연락 링크</label>
      <input
        id="meeting-contact-link"
        value={values.contactLink}
        onChange={(event) => onChange("contactLink", event.target.value)}
      />

      <label htmlFor="meeting-description">설명</label>
      <textarea
        id="meeting-description"
        value={values.description}
        onChange={(event) => onChange("description", event.target.value)}
      />

      {errorMessage ? <p>{errorMessage}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </button>
    </form>
  );
}
