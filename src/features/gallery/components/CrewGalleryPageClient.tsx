"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewGallery } from "@/shared/gallery/client";
import type { CrewGalleryItem } from "@/shared/gallery/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewGalleryPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 20;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function mergeItems(previousItems: CrewGalleryItem[], nextItems: CrewGalleryItem[]): CrewGalleryItem[] {
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

export function CrewGalleryPageClient({ crewId }: CrewGalleryPageClientProps) {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<CrewGalleryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedCoverMeetingIds, setFailedCoverMeetingIds] = useState<number[]>([]);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/gallery`;
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

        const response = await getCrewGallery(crewIdNumber, {
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

        reportOperationalError("crew.gallery.bootstrap_failed", error, {
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
          getUserMessage(error, "크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
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
      const response = await getCrewGallery(crewIdNumber, {
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("crew.gallery.load_more_failed", error, {
        level: "warn",
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(error, "크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleCoverError(meetingId: number) {
    setFailedCoverMeetingIds((currentIds) =>
      currentIds.includes(meetingId) ? currentIds : [...currentIds, meetingId],
    );
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루 사진첩</h1>
        <p>올바른 크루 경로가 아닙니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <h1>크루 사진첩</h1>
        <p>크루 사진첩을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>크루 사진첩</h1>
      <p>사진이 등록된 완료된 모임만 모아보고 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? <p>아직 사진이 없네요.</p> : null}

      {items.length > 0 ? (
        <>
          <ul
            aria-label="크루 사진첩 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {items.map((item) => {
              const showPlaceholder =
                !item.coverPhotoUrl || failedCoverMeetingIds.includes(item.meetingId);

              return (
                <li key={item.meetingId}>
                  <article
                    style={{
                      border: "1px solid #d9d9d9",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        background: "#f5f5f5",
                      }}
                    >
                      {showPlaceholder ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "grid",
                            placeItems: "center",
                            color: "#666",
                            textAlign: "center",
                            padding: 16,
                          }}
                        >
                          대표 사진 준비 중
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverPhotoUrl ?? undefined}
                          alt={`${item.meetingTitle} 대표 사진`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                          onError={() => handleCoverError(item.meetingId)}
                        />
                      )}

                      {item.extraPhotoCount > 0 ? (
                        <span
                          style={{
                            position: "absolute",
                            right: 12,
                            bottom: 12,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "rgba(0, 0, 0, 0.72)",
                            color: "#fff",
                            fontSize: 14,
                          }}
                        >
                          + {item.extraPhotoCount}장
                        </span>
                      ) : null}
                    </div>

                    <div style={{ display: "grid", gap: 6, padding: 14 }}>
                      <strong>{item.meetingDate}</strong>
                      <span>{item.meetingTitle}</span>
                    </div>
                  </article>
                </li>
              );
            })}
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
