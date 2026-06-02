"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub, getCrewSchedule } from "@/shared/crew/client";
import type { CrewHubResponse, CrewScheduleItem } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "./CrewPageClient";
import styles from "./CrewPageClient.module.css";

type CrewSchedulePageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

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

function toDateLabel(dateKey: string): string {
  const date = parseDate(dateKey);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function toWeekdayLabel(dateKey: string): string {
  return ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][
    parseDate(dateKey).getDay()
  ];
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

function isDateInMonth(dateKey: string, visibleMonth: Date): boolean {
  const date = parseDate(dateKey);
  return (
    date.getFullYear() === visibleMonth.getFullYear() &&
    date.getMonth() === visibleMonth.getMonth()
  );
}

function getMonthRange(visibleMonth: Date) {
  const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  return {
    from: toDateKey(start),
    to: toDateKey(end),
  };
}

function resolveSelectedDateKey(
  visibleMonth: Date,
  items: CrewScheduleItem[],
  previousSelectedDateKey: string | null,
): string {
  if (previousSelectedDateKey && isDateInMonth(previousSelectedDateKey, visibleMonth)) {
    return previousSelectedDateKey;
  }

  const todayKey = toDateKey(new Date());
  if (isDateInMonth(todayKey, visibleMonth) && items.some((item) => item.date === todayKey)) {
    return todayKey;
  }

  const firstVisibleItem = items.find((item) => isDateInMonth(item.date, visibleMonth));
  if (firstVisibleItem) {
    return firstVisibleItem.date;
  }

  if (isDateInMonth(todayKey, visibleMonth)) {
    return todayKey;
  }

  return toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
}

function toCalendarDayLabel(date: Date, itemCount: number): string {
  const suffix = itemCount > 0 ? `일정 ${itemCount}개` : "일정 없음";
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${suffix}`;
}

function toScheduleStatusLabel(item: CrewScheduleItem): string {
  if (item.isCanceled || item.meetingStatus === "CANCELED") {
    return "취소";
  }

  if (item.meetingStatus === "COMPLETED") {
    return "완료";
  }

  if (item.meetingStatus === "RECRUITMENT_CLOSED" || item.recruitmentStatus === "CLOSED") {
    return "마감";
  }

  return "모집";
}

function toScheduleTone(item: CrewScheduleItem): "open" | "closed" | "completed" | "canceled" {
  if (item.isCanceled || item.meetingStatus === "CANCELED") {
    return "canceled";
  }

  if (item.meetingStatus === "COMPLETED") {
    return "completed";
  }

  if (item.meetingStatus === "RECRUITMENT_CLOSED" || item.recruitmentStatus === "CLOSED") {
    return "closed";
  }

  return "open";
}

function toParticipantLabel(item: CrewScheduleItem): string {
  if (typeof item.capacity === "number") {
    return `${item.participantCount} / ${item.capacity}명`;
  }

  return `${item.participantCount}명`;
}

export function CrewSchedulePageClient({ crewId }: CrewSchedulePageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [hubErrorMessage, setHubErrorMessage] = useState<string | null>(null);
  const [isHubLoading, setIsHubLoading] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<CrewScheduleItem[]>([]);
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState<string | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/schedule`, [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void getCrewHub(crewIdNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCrew(response);
        setHubErrorMessage(null);
        setIsHubLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.schedule.hub_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setHubErrorMessage(
          getUserMessage(error, "크루 일정 화면을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsHubLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, routePath, router]);

  useEffect(() => {
    if (!hasValidCrewId || isHubLoading || hubErrorMessage || !crew) {
      return;
    }

    let isMounted = true;

    async function loadSchedule() {
      setIsScheduleLoading(true);
      setScheduleErrorMessage(null);

      try {
        const response = await getCrewSchedule(crewIdNumber, getMonthRange(visibleMonth));

        if (!isMounted) {
          return;
        }

        setScheduleItems(response.items);
        setSelectedDateKey((current) =>
          resolveSelectedDateKey(visibleMonth, response.items, current),
        );
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.schedule.load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setScheduleErrorMessage(
          getUserMessage(error, "일정 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
      } finally {
        if (isMounted) {
          setIsScheduleLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [
    crewIdNumber,
    crew,
    hasValidCrewId,
    hubErrorMessage,
    isHubLoading,
    publicCrewPath,
    routePath,
    router,
    visibleMonth,
  ]);

  const itemsByDate = useMemo(() => {
    return scheduleItems.reduce<Record<string, CrewScheduleItem[]>>((acc, item) => {
      acc[item.date] ??= [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [scheduleItems]);

  const resolvedSelectedDateKey =
    selectedDateKey ?? resolveSelectedDateKey(visibleMonth, scheduleItems, null);
  const selectedItems = useMemo(() => {
    return [...(itemsByDate[resolvedSelectedDateKey] ?? [])].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
  }, [itemsByDate, resolvedSelectedDateKey]);
  const isWholeMonthEmpty = !isScheduleLoading && !scheduleErrorMessage && scheduleItems.length === 0;

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>방탈 일정</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isHubLoading) {
    return (
      <main>
        <p>크루 일정 화면을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (hubErrorMessage || !crew) {
    return (
      <main>
        <h1>방탈 일정</h1>
        <p>{hubErrorMessage ?? "크루 일정 화면을 불러오지 못했어요."}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="schedule" crew={resolvedCrew} crewId={crewId}>
      <section className={`${styles.tabPanel} ${styles.scheduleTabPanel}`}>
        <h1>방탈 일정</h1>

      {isScheduleLoading ? (
        <section aria-label="일정 섹션" className={styles.scheduleStateCard}>
          <p>일정 정보를 불러오는 중입니다.</p>
        </section>
      ) : scheduleErrorMessage ? (
        <section aria-label="일정 섹션" className={styles.scheduleStateCard}>
          <p>{scheduleErrorMessage}</p>
          <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth))}>
            다시 시도
          </button>
        </section>
      ) : (
        <section aria-label="일정 섹션" className={styles.scheduleContentGrid}>
          <section aria-label="월간 방탈 일정" className={styles.scheduleCalendarCard}>
            <div className={styles.scheduleMonthHeader}>
              <button
                type="button"
                aria-label="이전 달"
                className={styles.scheduleMonthButton}
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
              >
                ‹
              </button>
              <strong>{toMonthLabel(visibleMonth)}</strong>
              <button
                type="button"
                aria-label="다음 달"
                className={styles.scheduleMonthButton}
                onClick={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
              >
                ›
              </button>
            </div>

            <div className={styles.scheduleWeekdayGrid}>
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <strong key={day} data-weekend={index === 0 || index === 6 ? "true" : "false"}>
                  {day}
                </strong>
              ))}
            </div>

            <div className={styles.scheduleDayGrid}>
              {days.map((date) => {
                const dateKey = toDateKey(date);
                const dayItems = itemsByDate[dateKey] ?? [];
                const isSelected = dateKey === resolvedSelectedDateKey;
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const hasSchedule = dayItems.length > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={toCalendarDayLabel(date, dayItems.length)}
                    aria-pressed={isSelected}
                    className={styles.scheduleDayButton}
                    data-outside-month={isCurrentMonth ? "false" : "true"}
                    onClick={() => setSelectedDateKey(dateKey)}
                  >
                    <span className={styles.scheduleDayNumber}>{date.getDate()}</span>
                    {hasSchedule ? (
                      <span className={styles.scheduleDayDots} aria-hidden="true">
                        {dayItems.slice(0, 3).map((item) => (
                          <span key={item.meetingId} data-tone={toScheduleTone(item)} />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {isWholeMonthEmpty ? (
              <p className={styles.scheduleEmptyText}>이번 달에는 아직 등록된 방탈 일정이 없어요.</p>
            ) : null}
          </section>

          <aside aria-label="선택 날짜 일정" className={styles.scheduleSelectedCard}>
            <header className={styles.scheduleSelectedHeader}>
              <div>
                <div className={styles.scheduleSelectedTitleRow}>
                  <h2>{toDateLabel(resolvedSelectedDateKey)}</h2>
                  <span className={styles.scheduleWeekdayPill}>
                    {toWeekdayLabel(resolvedSelectedDateKey)}
                  </span>
                </div>
                <span>일정 {selectedItems.length}개</span>
              </div>
            </header>

            {selectedItems.length > 0 ? (
              <div className={styles.scheduleSelectedList}>
                {selectedItems.map((item) => (
                  <Link
                    key={item.meetingId}
                    href={`/crews/${crewId}/meetings/${item.meetingId}`}
                    data-canceled={item.isCanceled ? "true" : "false"}
                    className={styles.scheduleMeetingCard}
                  >
                    <div className={styles.scheduleMeetingMeta}>
                      <span>{item.time}</span>
                      <span data-tone={toScheduleTone(item)}>{toScheduleStatusLabel(item)}</span>
                    </div>
                    <strong>{item.themeName}</strong>
                    <span>{item.place}</span>
                    <span className={styles.scheduleParticipantCount}>{toParticipantLabel(item)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.scheduleEmptyText}>선택한 날짜에는 방탈 일정이 없어요.</p>
            )}
          </aside>
        </section>
      )}
      </section>
    </CrewWorkspaceShell>
  );
}
