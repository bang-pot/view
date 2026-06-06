"use client";

import Link from "next/link";

import type { MeetingListItem } from "@/shared/meeting/types";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";

import styles from "./MeetingListPageClient.module.css";

type MeetingListContentProps = {
  crewId: string;
  createPath: string;
  items: MeetingListItem[];
  hasNext: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const RECRUITMENT_FILTERS = ["전체", "모집 중", "마감"] as const;
const MEETING_STATE_FILTERS = ["전체", "예정", "완료", "취소"] as const;

function formatMeetingDate(date: string, time: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return `${date} ${time}`;
  }

  const [, year, month, day] = match;
  const weekdayIndex = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();

  return `${year}. ${month}. ${day} (${WEEKDAY_LABELS[weekdayIndex]}) ${time}`;
}

function getRecruitmentLabel(status: MeetingListItem["status"]): "모집 중" | "마감" {
  return status === "RECRUITING" ? "모집 중" : "마감";
}

function getMeetingStateLabel(status: MeetingListItem["status"]): "예정" | "완료" | "취소" {
  switch (status) {
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소";
    case "RECRUITING":
    case "RECRUITMENT_CLOSED":
    default:
      return "예정";
  }
}

function getRecruitmentTone(status: MeetingListItem["status"]): string {
  return status === "RECRUITING" ? styles.statusOpen : styles.statusClosed;
}

function getMeetingStateTone(status: MeetingListItem["status"]): string {
  switch (status) {
    case "COMPLETED":
      return styles.statusDone;
    case "CANCELED":
      return styles.statusCanceled;
    default:
      return styles.statusPlanned;
  }
}

export function MeetingListContent({
  crewId,
  createPath,
  items,
  hasNext,
  isLoadingMore,
  onLoadMore,
}: MeetingListContentProps) {
  return (
    <section className={styles.meetingPanel}>
      <header className={styles.pageHeader}>
        <h1>방탈 모집</h1>
        <Button className={styles.createButton} href={createPath} leftIcon={<span className={styles.buttonIcon} />} size="md">
          모집 만들기
        </Button>
      </header>

      <div className={styles.filterBar} aria-label="방탈 모집 필터">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>모집 상태</span>
          {RECRUITMENT_FILTERS.map((label) => (
            <button
              key={label}
              className={styles.filterChip}
              data-active={label === "전체" ? "true" : "false"}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.filterDivider} aria-hidden="true" />
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>모임 상태</span>
          {MEETING_STATE_FILTERS.map((label) => (
            <button
              key={label}
              className={styles.filterChip}
              data-active={label === "전체" ? "true" : "false"}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.emptyState}>아직 등록된 방탈 모집이 없어요.</p>
      ) : (
        <ul aria-label="방탈 모집 목록" className={styles.meetingGrid}>
          {items.map((meeting, index) => {
            const recruitmentLabel = getRecruitmentLabel(meeting.status);
            const meetingStateLabel = getMeetingStateLabel(meeting.status);
            const hasVisual = index === 0;

            return (
              <li key={meeting.meetingId}>
                <article className={styles.meetingCard} data-has-visual={hasVisual ? "true" : "false"}>
                  {hasVisual ? <div className={styles.meetingVisual} aria-hidden="true" /> : null}
                  <div className={styles.meetingBody}>
                    <div className={styles.statusRow}>
                      <Chip className={getRecruitmentTone(meeting.status)} size="sm" variant="solid">
                        {recruitmentLabel}
                      </Chip>
                      <Chip className={getMeetingStateTone(meeting.status)} size="sm" variant="solid">
                        {meetingStateLabel}
                      </Chip>
                    </div>
                    <h2>
                      <Link href={`/crews/${crewId}/meetings/${meeting.meetingId}`}>
                        {meeting.title ?? meeting.themeName}
                      </Link>
                    </h2>
                    <p className={styles.themeName}>{meeting.themeName}</p>
                    <p className={styles.dateText}>{formatMeetingDate(meeting.date, meeting.time)}</p>
                    <p className={styles.progressText}>탈출 진행도 : {meetingStateLabel}</p>
                  </div>
                  <footer className={styles.cardFooter}>
                    <strong>
                      {meeting.participantCount} / {meeting.capacity}명
                    </strong>
                    <span>
                      <i aria-hidden="true" />
                      {meeting.place}
                    </span>
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      {hasNext ? (
        <Button className={styles.loadMoreButton} disabled={isLoadingMore} onClick={onLoadMore} type="button" variant="ghost">
          {isLoadingMore ? "불러오는 중" : "더보기"}
        </Button>
      ) : null}
    </section>
  );
}
