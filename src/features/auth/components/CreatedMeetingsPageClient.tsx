"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getCreatedMeetings, getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import type { CreatedMeetingListItem, CreatedMeetingStatus } from "@/shared/auth/types";

const CREATED_MEETINGS_PATH = "/profile/created-meetings";
const PAGE_SIZE = 20;

function mergeItems(
  previousItems: CreatedMeetingListItem[],
  nextItems: CreatedMeetingListItem[],
): CreatedMeetingListItem[] {
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

function toStatusLabel(status: CreatedMeetingStatus): string {
  switch (status) {
    case "RECRUITING":
      return "모집 중";
    case "RECRUITMENT_CLOSED":
      return "모집 마감";
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소됨";
    default:
      return status;
  }
}

export function CreatedMeetingsPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<CreatedMeetingListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadFirstPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCreatedMeetings({
        page: 0,
        size: PAGE_SIZE,
      });

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("auth.created_meetings.bootstrap_failed", error, {
        route: CREATED_MEETINGS_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "생성 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasBootstrappedRef.current) {
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

        const destination = resolveProtectedDestination(me, CREATED_MEETINGS_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage();
      } catch (error) {
        reportOperationalError("auth.created_meetings.auth_failed", error, {
          route: CREATED_MEETINGS_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "생성 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleRetry() {
    await loadFirstPage();
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const response = await getCreatedMeetings({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.created_meetings.load_more_failed", error, {
        level: "warn",
        route: CREATED_MEETINGS_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "생성 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <h1>생성 모임</h1>
        <p>생성 모임 목록을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>생성 모임</h1>
      <p>내가 host로 연 모임을 다시 확인하고, 바로 기존 모임 상세로 이어갈 수 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}

      {!errorMessage && items.length === 0 ? <p>아직 만든 모임이 없어요.</p> : null}

      {items.length > 0 ? (
        <>
          <ul
            aria-label="생성 모임 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {items.map((item) => (
              <li key={item.meetingId}>
                <Link
                  href={`/crews/${item.crewId}/meetings/${item.meetingId}`}
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 16,
                    border: "1px solid #d9d9d9",
                    borderRadius: 16,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{item.title}</strong>
                    <span>{toStatusLabel(item.status)}</span>
                  </div>
                  <span>
                    {item.date} {item.time}
                  </span>
                  <span>{item.crewName}</span>
                </Link>
              </li>
            ))}
          </ul>

          {hasNext ? (
            <button type="button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
            </button>
          ) : (
            <p>여기까지 모두 확인했어요.</p>
          )}
        </>
      ) : null}

      {!items.length && errorMessage ? (
        <button type="button" onClick={handleRetry}>
          다시 시도
        </button>
      ) : null}
    </main>
  );
}
