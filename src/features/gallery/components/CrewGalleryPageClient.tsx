"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type TouchEvent } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  getCrewGallery,
  getCrewGalleryDetail,
} from "@/shared/gallery/client";
import type {
  CrewGalleryDetail,
  CrewGalleryDetailPhoto,
  CrewGalleryItem,
} from "@/shared/gallery/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import crewWorkspaceStyles from "@/features/crew/components/CrewPageClient.module.css";

type CrewGalleryPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 20;
const SWIPE_THRESHOLD = 40;

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

function getPhotoPlaceholderText(order?: number): string {
  return typeof order === "number"
    ? `${order}번 사진을 불러올 수 없어요.`
    : "대표 사진 준비 중";
}

function GalleryPlaceholderGrid() {
  return (
    <ul className={crewWorkspaceStyles.placeholderGrid} aria-label="사진첩 미리보기">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={`gallery-placeholder-${index + 1}`}>
          <article className={crewWorkspaceStyles.placeholderCard}>
            <div className={crewWorkspaceStyles.placeholderImage}>이미지 준비 중</div>
            <div className={crewWorkspaceStyles.placeholderMeta}>
              <strong>방탈 사진 {index + 1}</strong>
              <span>모임 사진이 등록되면 이곳에 보여요.</span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function CrewGalleryPageClient({ crewId }: CrewGalleryPageClientProps) {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const swipeStartXRef = useRef<number | null>(null);

  const [items, setItems] = useState<CrewGalleryItem[]>([]);
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedCoverMeetingIds, setFailedCoverMeetingIds] = useState<number[]>([]);

  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [detailByMeetingId, setDetailByMeetingId] = useState<Record<number, CrewGalleryDetail>>({});
  const [detailErrorByMeetingId, setDetailErrorByMeetingId] = useState<Record<number, string>>({});
  const [detailLoadingMeetingId, setDetailLoadingMeetingId] = useState<number | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [failedDetailPhotoIds, setFailedDetailPhotoIds] = useState<number[]>([]);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/gallery`;
  const publicCrewPath = buildPublicCrewPath(crewId);

  const selectedCard =
    selectedMeetingId != null
      ? items.find((item) => item.meetingId === selectedMeetingId) ?? null
      : null;
  const selectedDetail =
    selectedMeetingId != null ? detailByMeetingId[selectedMeetingId] ?? null : null;
  const selectedDetailError =
    selectedMeetingId != null ? detailErrorByMeetingId[selectedMeetingId] ?? null : null;
  const selectedPhoto =
    selectedDetail != null && selectedPhotoIndex != null
      ? selectedDetail.photos[selectedPhotoIndex] ?? null
      : null;

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

        const [crewResult, galleryResult] = await Promise.allSettled([
          getCrewHub(crewIdNumber),
          getCrewGallery(crewIdNumber, {
            page: 0,
            size: PAGE_SIZE,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        if (crewResult.status === "fulfilled") {
          setCrew(crewResult.value);
        }

        if (galleryResult.status !== "fulfilled") {
          throw galleryResult.reason;
        }

        const response = galleryResult.value;
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

  useEffect(() => {
    if (selectedMeetingId == null) {
      return;
    }

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousPosition = style.position;
    const previousTop = style.top;
    const previousWidth = style.width;

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";

    return () => {
      style.overflow = previousOverflow;
      style.position = previousPosition;
      style.top = previousTop;
      style.width = previousWidth;
      window.scrollTo({ top: scrollY });
    };
  }, [selectedMeetingId]);

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

  function handleDetailPhotoError(photoId: number) {
    setFailedDetailPhotoIds((currentIds) =>
      currentIds.includes(photoId) ? currentIds : [...currentIds, photoId],
    );
  }

  async function openMeetingDetail(meetingId: number) {
    setSelectedMeetingId(meetingId);
    setSelectedPhotoIndex(null);

    if (detailByMeetingId[meetingId] || detailLoadingMeetingId === meetingId) {
      return;
    }

    setDetailLoadingMeetingId(meetingId);
    setDetailErrorByMeetingId((current) => {
      const next = { ...current };
      delete next[meetingId];
      return next;
    });

    try {
      const detail = await getCrewGalleryDetail(crewIdNumber, meetingId);

      setDetailByMeetingId((current) => ({
        ...current,
        [meetingId]: detail,
      }));
    } catch (error) {
      const shouldRedirect =
        isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED";

      reportOperationalError("crew.gallery.detail_failed", error, {
        level: shouldRedirect ? "warn" : "warn",
        route: routePath,
      });

      if (shouldRedirect) {
        router.replace(publicCrewPath);
        return;
      }

      setDetailErrorByMeetingId((current) => ({
        ...current,
        [meetingId]: getUserMessage(
          error,
          "사진 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      }));
    } finally {
      setDetailLoadingMeetingId((current) => (current === meetingId ? null : current));
    }
  }

  function closeMeetingDetail() {
    setSelectedPhotoIndex(null);
    setSelectedMeetingId(null);
  }

  function openLightbox(index: number) {
    setSelectedPhotoIndex(index);
  }

  function closeLightbox() {
    setSelectedPhotoIndex(null);
  }

  function movePhoto(direction: -1 | 1) {
    if (!selectedDetail || selectedDetail.photos.length === 0) {
      return;
    }

    setSelectedPhotoIndex((currentIndex) => {
      if (currentIndex == null) {
        return currentIndex;
      }

      return (currentIndex + direction + selectedDetail.photos.length) % selectedDetail.photos.length;
    });
  }

  function handleLightboxTouchStart(event: TouchEvent<HTMLDivElement>) {
    swipeStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleLightboxTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (swipeStartXRef.current == null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? swipeStartXRef.current;
    const deltaX = endX - swipeStartXRef.current;
    swipeStartXRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    movePhoto(deltaX < 0 ? 1 : -1);
  }

  function renderThumbnail(photo: CrewGalleryDetailPhoto, index: number) {
    const showPlaceholder = failedDetailPhotoIds.includes(photo.photoId);

    return (
      <button
        key={photo.photoId}
        type="button"
        onClick={() => openLightbox(index)}
        data-testid={`gallery-thumb-button-${photo.order}`}
        aria-label={`${photo.order}번 사진 보기`}
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 12,
          overflow: "hidden",
          padding: 0,
          background: "#f5f5f5",
          aspectRatio: "1 / 1",
          cursor: "pointer",
        }}
      >
        {showPlaceholder ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: "#666",
              padding: 12,
            }}
          >
            {getPhotoPlaceholderText(photo.order)}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={`${photo.order}번 사진`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={() => handleDetailPhotoError(photo.photoId)}
          />
        )}
      </button>
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

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  if (isLoading) {
    return (
      <CrewWorkspaceShell activeMenu="gallery" crew={resolvedCrew} crewId={crewId}>
        <section className={crewWorkspaceStyles.tabPanel}>
          <h1>사진첩 준비 중</h1>
          <p>크루 사진첩을 불러오는 중입니다.</p>
          <GalleryPlaceholderGrid />
        </section>
      </CrewWorkspaceShell>
    );
  }

  return (
    <CrewWorkspaceShell activeMenu="gallery" crew={resolvedCrew} crewId={crewId}>
      <section className={crewWorkspaceStyles.tabPanel}>
      <h1>크루 사진첩</h1>
      <p>사진이 등록된 완료된 모임만 모아보고 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? (
        <>
          <p>아직 사진이 없네요.</p>
          <GalleryPlaceholderGrid />
        </>
      ) : null}

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
                  <button
                    type="button"
                    onClick={() => void openMeetingDetail(item.meetingId)}
                    data-testid={`gallery-card-button-${item.meetingId}`}
                    aria-label={`${item.meetingTitle} 사진 상세 보기`}
                    style={{
                      border: 0,
                      padding: 0,
                      width: "100%",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
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
                            {getPhotoPlaceholderText()}
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
                  </button>
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
              {isLoadingMore ? "더 불러오는 중.." : "더보기"}
            </button>
          ) : (
            <p>여기까지 모두 확인했어요.</p>
          )}
        </>
      ) : null}

      {selectedMeetingId != null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedCard?.meetingDate ?? ""} 사진 상세`}
          data-testid="gallery-detail-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: "min(960px, 100%)",
              maxHeight: "85vh",
              overflow: "auto",
              borderRadius: 20,
              background: "#fff",
              padding: 20,
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{selectedDetail?.meetingDate ?? selectedCard?.meetingDate}</strong>
                {selectedDetail?.meetingTitle ? <span>{selectedDetail.meetingTitle}</span> : null}
              </div>

              <button
                type="button"
                onClick={closeMeetingDetail}
                data-testid="gallery-detail-close"
              >
                시트 모달 닫기
              </button>
            </div>

            {detailLoadingMeetingId === selectedMeetingId ? (
              <p>사진 상세를 불러오는 중입니다.</p>
            ) : selectedDetailError ? (
              <p>{selectedDetailError}</p>
            ) : selectedDetail ? (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                {selectedDetail.photos.map((photo, index) => renderThumbnail(photo, index))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 라이트박스"
          data-testid="gallery-lightbox"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.92)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: "min(1080px, 100%)",
              display: "grid",
              gap: 16,
              justifyItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#fff",
              }}
            >
              <button
                type="button"
                onClick={closeLightbox}
                data-testid="gallery-lightbox-close"
              >
                라이트박스 닫기
              </button>
              <strong>
                {selectedPhotoIndex! + 1} / {selectedDetail?.photos.length}
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                type="button"
                onClick={() => movePhoto(-1)}
                data-testid="gallery-lightbox-prev"
              >
                이전 사진
              </button>

              <div
                style={{
                  flex: 1,
                  minHeight: 320,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {failedDetailPhotoIds.includes(selectedPhoto.photoId) ? (
                  <div style={{ color: "#fff", textAlign: "center", padding: 24 }}>
                    {getPhotoPlaceholderText(selectedPhoto.order)}
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPhoto.url}
                    alt={`${selectedPhoto.order}번 사진 큰 보기`}
                    style={{
                      width: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={() => handleDetailPhotoError(selectedPhoto.photoId)}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => movePhoto(1)}
                data-testid="gallery-lightbox-next"
              >
                다음 사진
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </section>
    </CrewWorkspaceShell>
  );
}
