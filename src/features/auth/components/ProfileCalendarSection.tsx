"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getMyCalendar } from "@/shared/auth/client";
import type { ProfileCalendarItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ProfilePageClient.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function toReadableDate(value: string): string {
  const date = parseDate(value);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function toMeetingStatusLabel(status: ProfileCalendarItem["meetingStatus"]): string {
  switch (status) {
    case "RECRUITMENT_CLOSED":
      return "모집 마감";
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소됨";
    case "RECRUITING":
      return "모집 중";
  }
}

function buildCalendarDays(visibleMonth: Date): readonly Date[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return current;
  });
}

function resolveInitialMonth(items: readonly ProfileCalendarItem[]): Date {
  if (items.length === 0) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const baseDate = parseDate(items[0].date);
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
}

function resolveInitialSelectedDate(items: readonly ProfileCalendarItem[]): string {
  return items[0]?.date ?? toDateKey(new Date());
}

function toDayButtonLabel(day: number, count: number, canceledOnly: boolean): string {
  if (count === 0) {
    return `${day}일`;
  }

  return canceledOnly ? `${day}일 취소 ${count}개` : `${day}일 일정 ${count}개`;
}

function toDotClassName(item: ProfileCalendarItem): string {
  if (item.isCanceled || item.meetingStatus === "CANCELED") {
    return styles.dotCanceled;
  }

  return item.participationRole === "HOST" ? styles.dotHost : styles.dotParticipant;
}

export function ProfileCalendarSection() {
  const [items, setItems] = useState<ProfileCalendarItem[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCalendar() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMyCalendar();
      setItems(response.items);
      setVisibleMonth(resolveInitialMonth(response.items));
      setSelectedDateKey(resolveInitialSelectedDate(response.items));
    } catch (error) {
      reportOperationalError("auth.profile.calendar.load_failed", error, {
        route: "/profile",
      });
      setErrorMessage(
        getUserMessage(error, "달력 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCalendar();
  }, []);

  const itemsByDate = useMemo(() => {
    return items.reduce<Record<string, ProfileCalendarItem[]>>((acc, item) => {
      acc[item.date] ??= [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [items]);

  const selectedItems = itemsByDate[selectedDateKey] ?? [];
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  return (
    <section className={styles.scheduleGrid} aria-label="마이페이지 일정">
      <div className={styles.calendarCard}>
        {isLoading ? <p className={styles.stateText}>달력 정보를 불러오는 중입니다.</p> : null}

        {!isLoading && errorMessage ? (
          <div className={styles.emptyState}>
            <p>{errorMessage}</p>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadCalendar()}>
              다시 시도
            </button>
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <div className={styles.calendarHeader}>
              <button
                type="button"
                aria-label="이전 달"
                onClick={() =>
                  setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
              >
                ‹
              </button>
              <h2>{toMonthLabel(visibleMonth)}</h2>
              <button
                type="button"
                aria-label="다음 달"
                onClick={() =>
                  setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
              >
                ›
              </button>
            </div>

            <div className={styles.weekdayGrid} aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className={styles.dayGrid}>
              {days.map((date) => {
                const dateKey = toDateKey(date);
                const dayItems = itemsByDate[dateKey] ?? [];
                const canceledOnly = dayItems.length > 0 && dayItems.every((item) => item.isCanceled);
                const isSelected = dateKey === selectedDateKey;
                const isInMonth = date.getMonth() === visibleMonth.getMonth();

                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={toDayButtonLabel(date.getDate(), dayItems.length, canceledOnly)}
                    className={[
                      styles.dayButton,
                      isSelected ? styles.dayButtonSelected : "",
                      isInMonth ? "" : styles.dayButtonMuted,
                    ].join(" ")}
                    onClick={() => setSelectedDateKey(dateKey)}
                  >
                    <span>{date.getDate()}</span>
                    {dayItems.length > 0 ? (
                      <span className={styles.dotGroup}>
                        {dayItems.slice(0, 3).map((item) => (
                          <span key={item.meetingId} className={toDotClassName(item)} />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <aside className={styles.upcomingCard} aria-label="예정 일정">
        <h2>예정 일정</h2>
        {selectedItems.length > 0 ? (
          <ul className={styles.upcomingList}>
            {selectedItems.map((item) => (
              <li key={item.meetingId}>
                <Link href={`/crews/${item.crewId}/meetings/${item.meetingId}`}>
                  <span className={styles.dDayBadge}>{item.isCanceled ? "취소" : "D-Day"}</span>
                  <span>
                    <strong>{item.meetingTitle}</strong>
                    <small>{item.crewName}</small>
                    <small>
                      {toReadableDate(item.date)} {item.time} · {toMeetingStatusLabel(item.meetingStatus)}
                    </small>
                  </span>
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.stateText}>아직 표시할 일정이 없어요</p>
        )}
      </aside>
    </section>
  );
}
