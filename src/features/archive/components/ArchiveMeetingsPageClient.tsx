"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getArchiveMeetings } from "@/shared/archive/client";
import type { ArchiveMeetingCard } from "@/shared/archive/types";
import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { hasDeletedMeetingLog } from "@/shared/log/deleted-session";
import { reportOperationalError } from "@/shared/monitoring/operations";

const ARCHIVE_PATH = "/archive/meetings";
const PAGE_SIZE = 20;

function mergeItems(
  previousItems: ArchiveMeetingCard[],
  nextItems: ArchiveMeetingCard[],
): ArchiveMeetingCard[] {
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

function toResultLabel(result: ArchiveMeetingCard["result"]): string {
  return result === "SUCCESS" ? "결과 성공" : "결과 실패";
}

export function ArchiveMeetingsPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<ArchiveMeetingCard[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        const destination = resolveProtectedDestination(me, ARCHIVE_PATH);

        if (destination) {
          router.replace(destination);
          return;
        }

        const response = await getArchiveMeetings({
          page: 0,
          size: PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setItems(response.items);
        setPage(response.pageInfo.page);
        setHasNext(response.pageInfo.hasNext);
        setIsLoading(false);
      } catch (error) {
        reportOperationalError("archive.meetings.bootstrap_failed", error, {
          level: "warn",
          route: ARCHIVE_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const response = await getArchiveMeetings({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("archive.meetings.load_more_failed", error, {
        level: "warn",
        route: ARCHIVE_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <h1>완료된 모임 아카이브</h1>
        <p>완료된 모임 기록을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>완료된 모임 아카이브</h1>
      <p>함께했던 완료된 모임을 다시 살펴보고, 다음 기록 작성 흐름을 준비해 보세요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? <p>아직 완료된 모임 기록이 없어요</p> : null}

      {!errorMessage && items.length > 0 ? (
        <>
          <ul
            aria-label="완료된 모임 아카이브 목록"
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
                  gap: 12,
                }}
              >
                {item.posterImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.posterImageUrl}
                    alt={`${item.themeName} 포스터`}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      borderRadius: 12,
                      background: "#f5f5f5",
                      color: "#666",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    대표 이미지 준비 중
                  </div>
                )}

                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{item.themeName}</strong>
                  <span>{item.crewName}</span>
                  <span>{item.place}</span>
                  <span>{item.date}</span>
                  <span>{toResultLabel(item.result)}</span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/crews/${item.crewId}/meetings/${item.meetingId}`}>
                    모임 다시 보기
                  </Link>
                  {hasDeletedMeetingLog(item.meetingId) ? (
                    <span>삭제된 방탈로그는 다시 작성할 수 없어요.</span>
                  ) : (
                    <Link href={`/crews/${item.crewId}/meetings/${item.meetingId}/log`}>
                      방탈로그 작성·수정
                    </Link>
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
