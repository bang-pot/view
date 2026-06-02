"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getJoinedMeetings, getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import type {
  JoinedMeetingListItem,
  JoinedMeetingStatus,
} from "@/shared/auth/types";

const JOINED_MEETINGS_PATH = "/profile/joined-meetings";
const PAGE_SIZE = 20;

function mergeItems(
  previousItems: JoinedMeetingListItem[],
  nextItems: JoinedMeetingListItem[],
): JoinedMeetingListItem[] {
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

function toStatusLabel(status: JoinedMeetingStatus): string {
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

export function JoinedMeetingsPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<JoinedMeetingListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadFirstPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getJoinedMeetings({
        page: 0,
        size: PAGE_SIZE,
      });

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("auth.joined_meetings.bootstrap_failed", error, {
        route: JOINED_MEETINGS_PATH,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "참여 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
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

        const destination = resolveProtectedDestination(me, JOINED_MEETINGS_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage();
      } catch (error) {
        reportOperationalError("auth.joined_meetings.auth_failed", error, {
          route: JOINED_MEETINGS_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "참여 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
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
      const response = await getJoinedMeetings({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.joined_meetings.load_more_failed", error, {
        level: "warn",
        route: JOINED_MEETINGS_PATH,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "참여 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <h1>참여 모임</h1>
        <p>참여 모임 목록을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>참여 모임</h1>
      <p>참여했던 모임 이력을 다시 확인하고, 필요하면 기존 모임 상세로 바로 이어갈 수 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}

      {!errorMessage && items.length === 0 ? <p>아직 참여한 모임이 없어요.</p> : null}

      {items.length > 0 ? (
        <>
          <ul
            aria-label="참여 모임 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {items.map((item) => {
              const meetingHref = `/crews/${item.crewId}/meetings/${item.meetingId}`;

              return (
                <li
                  key={item.meetingId}
                  style={{
                    display: "grid",
                    gap: 10,
                    padding: 16,
                    border: "1px solid #d9d9d9",
                    borderRadius: 16,
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
                    <Link
                      href={meetingHref}
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      {item.title}
                    </Link>
                    <span>{toStatusLabel(item.status)}</span>
                  </div>

                  <div style={{ display: "grid", gap: 4 }}>
                    <span>{item.themeName}</span>
                    <span>{item.crewName}</span>
                    <span>
                      {item.date} {item.time}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href={meetingHref}>모임 상세 보기</Link>
                    {item.canWriteReview ? <Link href={meetingHref}>리뷰 작성하기</Link> : null}
                  </div>
                </li>
              );
            })}
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
