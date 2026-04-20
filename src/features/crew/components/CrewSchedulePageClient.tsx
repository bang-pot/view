"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub, getCrewSchedule } from "@/shared/crew/client";
import type { CrewScheduleItem, CrewScheduleMeetingStatus } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

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

  if (items.length > 0) {
    return items[0].date;
  }

  if (isDateInMonth(todayKey, visibleMonth)) {
    return todayKey;
  }

  return toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
}

function toStatusLabel(status: CrewScheduleMeetingStatus, isCanceled: boolean): string {
  if (isCanceled || status === "CANCELED") {
    return "취소";
  }

  if (status === "COMPLETED") {
    return "완료";
  }

  return "예정";
}

export function CrewSchedulePageClient({ crewId }: CrewSchedulePageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
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

        setCrewName(response.name);
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
    if (!hasValidCrewId || isHubLoading || hubErrorMessage || !crewName) {
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
    crewName,
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
  const selectedItems = itemsByDate[resolvedSelectedDateKey] ?? [];
  const isWholeMonthEmpty = !isScheduleLoading && !scheduleErrorMessage && scheduleItems.length === 0;

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>일정</h1>
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

  if (hubErrorMessage || !crewName) {
    return (
      <main>
        <h1>일정</h1>
        <p>{hubErrorMessage ?? "크루 일정 화면을 불러오지 못했어요."}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>일정</h1>
        <p>{crewName} 크루의 방탈 일정을 확인할 수 있어요.</p>
        <div>
          <Link href={hubPath}>크루 허브로 돌아가기</Link>
        </div>
      </header>

      {isScheduleLoading ? (
        <section aria-label="일정 섹션">
          <p>일정 정보를 불러오는 중입니다.</p>
        </section>
      ) : scheduleErrorMessage ? (
        <section aria-label="일정 섹션" style={{ display: "grid", gap: 12 }}>
          <p>{scheduleErrorMessage}</p>
          <div>
            <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth))}>
              다시 시도
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label="일정 섹션"
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
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

            {isWholeMonthEmpty ? <p>아직 등록된 일정이 없어요.</p> : null}

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
                const isSelected = dateKey === resolvedSelectedDateKey;
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const hasCanceledOnly = dayItems.length > 0 && dayItems.every((item) => item.isCanceled);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={`${date.getDate()}일`}
                    data-canceled={hasCanceledOnly ? "true" : "false"}
                    onClick={() => setSelectedDateKey(dateKey)}
                    style={{
                      minHeight: 76,
                      padding: 8,
                      borderRadius: 12,
                      border: isSelected ? "2px solid #111827" : "1px solid #d1d5db",
                      background: hasCanceledOnly ? "#e5e7eb" : "#ffffff",
                      color: isCurrentMonth ? "#111827" : "#9ca3af",
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
            aria-label="선택 날짜 일정"
            style={{
              display: "grid",
              gap: 12,
              padding: 16,
              border: "1px solid #d1d5db",
              borderRadius: 16,
              background: "#fafafa",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <strong>{resolvedSelectedDateKey}</strong>
              <span>
                {selectedItems.length > 0
                  ? `${selectedItems.length}개의 일정이 있어요.`
                  : "이 날짜에는 일정이 없어요."}
              </span>
            </div>

            {selectedItems.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {selectedItems.map((item) => (
                  <Link
                    key={item.meetingId}
                    href={`/crews/${crewId}/meetings/${item.meetingId}`}
                    data-canceled={item.isCanceled ? "true" : "false"}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid #d1d5db",
                      textDecoration: "none",
                      color: item.isCanceled ? "#4b5563" : "#111827",
                      background: item.isCanceled ? "#e5e7eb" : "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{item.themeName}</strong>
                      <span>{toStatusLabel(item.meetingStatus, item.isCanceled)}</span>
                    </div>
                    <span>{item.time}</span>
                    <span>{item.place}</span>
                    <span>참여 {item.participantCount}명</span>
                    {item.isCanceled ? <span>취소</span> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p>이 날짜에는 일정이 없어요.</p>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
