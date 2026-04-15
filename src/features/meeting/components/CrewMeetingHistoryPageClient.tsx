"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  getCrewMeetingHistory,
} from "@/shared/meeting/client";
import type { CrewMeetingHistoryItem } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PAGE_SIZE = 20;

type CrewMeetingHistoryPageClientProps = {
  crewId: string;
};

function mergeItems(
  previousItems: CrewMeetingHistoryItem[],
  nextItems: CrewMeetingHistoryItem[],
): CrewMeetingHistoryItem[] {
  const seen = new Set(previousItems.map((item) => item.meetingId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.meetingId)) {
      merged.push(item);
      seen.add(item.meetingId);
    }
  }

  return merged;
}

function toResultLabel(result: CrewMeetingHistoryItem["result"]): string {
  return result === "SUCCESS" ? "결과 성공" : "결과 실패";
}

function toMyLogStatusLabel(status: CrewMeetingHistoryItem["myLogStatus"]): string {
  return status === "HAS_LOG" ? "기록 있음" : "아직 기록 없음";
}

export function CrewMeetingHistoryPageClient({
  crewId,
}: CrewMeetingHistoryPageClientProps) {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<CrewMeetingHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/history/meetings`;
  const publicCrewPath = `/crews/public/${crewId}`;

  useEffect(() => {
    if (!hasValidCrewId || hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, routePath);

        if (destination) {
          router.replace(destination);
          return;
        }

        const response = await getCrewMeetingHistory(crewIdNumber, {
          page: 0,
          size: PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setItems(response.items);
        setPage(response.pageInfo.page);
        setHasNext(response.pageInfo.hasNext);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED";

        reportOperationalError("meeting.history.bootstrap_failed", error, {
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

        setErrorMessage(
          getUserMessage(
            error,
            "완료된 모임 히스토리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, routePath, router]);

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const response = await getCrewMeetingHistory(crewIdNumber, {
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("meeting.history.load_more_failed", error, {
        level: "warn",
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "완료된 모임 히스토리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>완료된 모임 히스토리</h1>
        <p>올바르지 않은 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <h1>완료된 모임 히스토리</h1>
        <p>완료된 모임 히스토리를 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>완료된 모임 히스토리</h1>
      <p>완료된 모임을 다시 보고, 내 방탈로그 상태에 따라 바로 이어서 볼 수 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? <p>아직 완료된 모임 히스토리가 없어요.</p> : null}

      {!errorMessage && items.length > 0 ? (
        <>
          <ul
            aria-label="완료된 모임 히스토리 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((item) => (
              <li
                key={item.meetingId}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{item.themeName}</strong>
                  <span>{item.meetingTitle}</span>
                  <span>{item.place}</span>
                  <span>{item.date}</span>
                  <span>{toResultLabel(item.result)}</span>
                  <span>내 기록 상태: {toMyLogStatusLabel(item.myLogStatus)}</span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.myLogStatus === "HAS_LOG" && item.logId ? (
                    <Link href={`/logs/${item.logId}`}>기록 보기</Link>
                  ) : (
                    <Link href={`/crews/${crewId}/meetings/${item.meetingId}/log`}>기록 작성</Link>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {hasNext ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              style={{ marginTop: 20 }}
            >
              {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
            </button>
          ) : (
            <p>여기까지 모두 확인했어요.</p>
          )}
        </>
      ) : null}
    </main>
  );
}
