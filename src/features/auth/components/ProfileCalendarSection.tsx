"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getMyCalendar } from "@/shared/auth/client";
import type {
  ProfileCalendarItem,
  ProfileCalendarParticipationRole,
} from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function toParticipationRoleLabel(role: ProfileCalendarParticipationRole): string {
  return role === "HOST" ? "모임장" : "참여자";
}

function toMeetingStatusLabel(status: ProfileCalendarItem["meetingStatus"]): string {
  switch (status) {
    case "RECRUITMENT_CLOSED":
      return "모집 마감";
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소됨";
    default:
      return "모집 중";
  }
}

function buildCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return current;
  });
}

function resolveInitialMonth(items: ProfileCalendarItem[]): Date {
  const today = new Date();

  if (items.length === 0) {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const todayMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
  const sameMonth = items.find((item) => {
    const itemDate = parseDate(item.date);
    return `${itemDate.getFullYear()}-${itemDate.getMonth()}` === todayMonthKey;
  });

  const baseDate = sameMonth ? parseDate(sameMonth.date) : parseDate(items[0].date);
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
}

function resolveInitialSelectedDate(items: ProfileCalendarItem[]): string {
  if (items.length === 0) {
    return toDateKey(new Date());
  }

  return items[0].date;
}

export function ProfileCalendarSection() {
  const [items, setItems] = useState<ProfileCalendarItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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
      setTotalCount(response.totalCount);

      const nextMonth = resolveInitialMonth(response.items);
      const nextSelectedDate = resolveInitialSelectedDate(response.items);

      setVisibleMonth(nextMonth);
      setSelectedDateKey(nextSelectedDate);
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
    <section
      aria-label="달력"
      style={{
        display: "grid",
        gap: 16,
        padding: 20,
        border: "1px solid #d9d9d9",
        borderRadius: 16,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <h2>달력</h2>
        <p>
          {totalCount > 0
            ? `현재 확인할 수 있는 일정이 ${totalCount}개 있어요.`
            : "아직 표시할 일정이 없어요"}
        </p>
      </div>

      {isLoading ? (
        <p>달력 정보를 불러오는 중입니다.</p>
      ) : errorMessage ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p>{errorMessage}</p>
          <div>
            <button type="button" onClick={() => void loadCalendar()}>
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
              >
                이전 달
              </button>
              <strong>{toMonthLabel(visibleMonth)}</strong>
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
              >
                다음 달
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <strong key={day} style={{ textAlign: "center" }}>
                  {day}
                </strong>
              ))}
              {days.map((date) => {
                const dateKey = toDateKey(date);
                const dayItems = itemsByDate[dateKey] ?? [];
                const isInMonth = date.getMonth() === visibleMonth.getMonth();
                const isSelected = dateKey === selectedDateKey;
                const hasCanceledOnly = dayItems.length > 0 && dayItems.every((item) => item.isCanceled);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={`${date.getDate()}일`}
                    onClick={() => setSelectedDateKey(dateKey)}
                    style={{
                      minHeight: 72,
                      padding: 8,
                      borderRadius: 12,
                      border: isSelected ? "2px solid #111827" : "1px solid #d9d9d9",
                      background: hasCanceledOnly ? "#f3f4f6" : "#ffffff",
                      color: isInMonth ? "#111827" : "#9ca3af",
                      display: "grid",
                      alignContent: "space-between",
                      justifyItems: "start",
                    }}
                  >
                    <span>{date.getDate()}일</span>
                    {dayItems.length > 0 ? (
                      <span style={{ fontSize: 12 }}>
                        {hasCanceledOnly ? `취소 ${dayItems.length}` : `일정 ${dayItems.length}`}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside
            aria-label="선택한 날짜 일정"
            style={{
              display: "grid",
              gap: 12,
              padding: 16,
              border: "1px solid #d9d9d9",
              borderRadius: 16,
              background: "#fafafa",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <strong>{selectedDateKey}</strong>
              <span>
                {selectedItems.length > 0
                  ? `${selectedItems.length}개의 일정이 있어요.`
                  : "해당 날짜에는 일정이 없어요"}
              </span>
            </div>

            {selectedItems.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {selectedItems.map((item) => (
                  <Link
                    key={item.meetingId}
                    href={`/crews/${item.crewId}/meetings/${item.meetingId}`}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid #d9d9d9",
                      textDecoration: "none",
                      color: item.isCanceled ? "#4b5563" : "inherit",
                      background: item.isCanceled ? "#e5e7eb" : "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{item.meetingTitle}</strong>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.isCanceled ? <span>취소</span> : null}
                        <span>{toParticipationRoleLabel(item.participationRole)}</span>
                      </div>
                    </div>
                    <span>{item.crewName}</span>
                    <span>
                      {item.date} {item.time}
                    </span>
                    <span>{toMeetingStatusLabel(item.meetingStatus)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>해당 날짜에는 일정이 없어요</p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
