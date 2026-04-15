"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewLogFeed } from "@/shared/log/client";
import type { CrewLogFeedItem } from "@/shared/log/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewLogFeedPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 20;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function buildCrewLogDetailPath(crewId: string, logId: number): string {
  return `/crews/${crewId}/logs/${logId}`;
}

function mergeItems(
  previousItems: CrewLogFeedItem[],
  nextItems: CrewLogFeedItem[],
): CrewLogFeedItem[] {
  const seen = new Set(previousItems.map((item) => item.logId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.logId)) {
      merged.push(item);
      seen.add(item.logId);
    }
  }

  return merged;
}

function getExcerpt(excerpt: string): string {
  return excerpt.trim() || "후기 요약이 아직 없습니다.";
}

export function CrewLogFeedPageClient({ crewId }: CrewLogFeedPageClientProps) {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<CrewLogFeedItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/logs`;
  const publicCrewPath = buildPublicCrewPath(crewId);

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

        const response = await getCrewLogFeed(crewIdNumber, {
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

        reportOperationalError("crew.log_feed.bootstrap_failed", error, {
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
          getUserMessage(error, "크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
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
      const response = await getCrewLogFeed(crewIdNumber, {
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("crew.log_feed.load_more_failed", error, {
        level: "warn",
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(error, "크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루 방탈로그</h1>
        <p>올바른 크루 경로가 아닙니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <h1>크루 방탈로그</h1>
        <p>크루 방탈로그 피드를 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>크루 방탈로그</h1>
      <p>크루원이 남긴 기록을 최신 작성순으로 다시 읽어보세요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? <p>아직 등록된 방탈로그가 없어요.</p> : null}

      {!errorMessage && items.length > 0 ? (
        <>
          <ul
            aria-label="크루 방탈로그 피드"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 16,
            }}
          >
            {items.map((item) => (
              <li key={item.logId}>
                <Link
                  href={buildCrewLogDetailPath(crewId, item.logId)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(160px, 220px) 1fr",
                    gap: 16,
                    border: "1px solid #d9d9d9",
                    borderRadius: 16,
                    padding: 16,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  {item.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverPhotoUrl}
                      alt={`${item.meetingTitle} 대표 사진`}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 180,
                        objectFit: "cover",
                        borderRadius: 12,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        minHeight: 180,
                        borderRadius: 12,
                        background: "#f5f5f5",
                        color: "#666",
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                        padding: 12,
                      }}
                    >
                      대표 사진 준비 중
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                    <strong>{getExcerpt(item.excerpt)}</strong>
                    <span>작성자 {item.authorNickname}</span>
                    <span>모임 {item.meetingTitle}</span>
                    <span>모임 날짜 {item.meetingDate}</span>
                    <span>기록 시간 {item.createdAt}</span>
                    {item.extraPhotoCount > 0 ? <span>+ {item.extraPhotoCount}장</span> : null}
                  </div>
                </Link>
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
            <p>여기까지 모두 읽었어요.</p>
          )}
        </>
      ) : null}
    </main>
  );
}
