"use client";

import Link from "next/link";

import type { JoinedMeetingListItem, JoinedMeetingStatus } from "@/shared/auth/types";

import styles from "./JoinedMeetingCard.module.css";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function toStatusLabel(status: JoinedMeetingStatus): string {
  switch (status) {
    case "RECRUITING":
      return "모집중";
    case "RECRUITMENT_CLOSED":
    case "COMPLETED":
      return "마감";
    case "CANCELED":
      return "취소";
  }
}

function toProgressLabel(status: JoinedMeetingStatus): string {
  switch (status) {
    case "RECRUITING":
    case "RECRUITMENT_CLOSED":
      return "예정";
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소";
  }
}

function toStatusTone(status: JoinedMeetingStatus): "blue" | "red" | "gray" {
  switch (status) {
    case "RECRUITING":
      return "blue";
    case "RECRUITMENT_CLOSED":
    case "COMPLETED":
      return "red";
    case "CANCELED":
      return "gray";
  }
}

function formatMeetingDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return `${date} ${time}`;
  }

  const dayLabel = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  return `${year}. ${paddedMonth}. ${paddedDay} (${dayLabel}) ${time}`;
}

function formatParticipantCount(item: JoinedMeetingListItem): string {
  if (item.participantCount === null || item.participantCount === undefined) {
    return "인원 정보 준비 중";
  }

  if (item.capacity === null || item.capacity === undefined) {
    return `${item.participantCount}명`;
  }

  return `${item.participantCount} / ${item.capacity}명`;
}

export function JoinedMeetingCard({ item }: { readonly item: JoinedMeetingListItem }) {
  const meetingHref = `/crews/${item.crewId}/meetings/${item.meetingId}`;
  const statusTone = toStatusTone(item.status);

  return (
    <li className={styles.item}>
      <Link href={meetingHref} className={styles.cardLink} aria-label={`${item.title} 모임 상세 보기`}>
        <div className={styles.posterFallback} aria-hidden="true" />
        <div className={styles.content}>
          <span className={styles.statusBadge} data-tone={statusTone}>
            {toStatusLabel(item.status)}
          </span>
          <strong className={styles.title}>{item.themeName}</strong>
          <span className={styles.meta}>{item.crewName}</span>
          <span className={styles.meta}>{formatMeetingDateTime(item.date, item.time)}</span>
          <span className={styles.meta}>탈출 진행도 : {toProgressLabel(item.status)}</span>
        </div>
        <div className={styles.footer}>
          <strong>{formatParticipantCount(item)}</strong>
          <span className={styles.crewBadge}>
            <span aria-hidden="true" />
            {item.crewName}
          </span>
        </div>
      </Link>
      {item.canWriteReview ? (
        <Link href={meetingHref} className={styles.reviewLink}>
          리뷰 작성하기
        </Link>
      ) : null}
    </li>
  );
}
