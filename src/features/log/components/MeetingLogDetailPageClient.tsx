"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewLogDetail, getMeetingLogDetail } from "@/shared/log/client";
import type { MeetingLogDetail } from "@/shared/log/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type MeetingLogDetailPageClientProps = {
  logId: string;
  crewId?: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

export function MeetingLogDetailPageClient({
  logId,
  crewId,
}: MeetingLogDetailPageClientProps) {
  const router = useRouter();
  const [log, setLog] = useState<MeetingLogDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const logIdNumber = Number(logId);
  const crewIdNumber = crewId ? Number(crewId) : null;
  const hasValidLogId = Number.isFinite(logIdNumber);
  const hasValidCrewId = crewId == null || Number.isFinite(crewIdNumber);
  const isCrewScoped = crewId != null;
  const routePath = useMemo(
    () => (crewId ? `/crews/${crewId}/logs/${logId}` : `/logs/${logId}`),
    [crewId, logId],
  );
  const publicCrewPath = crewId ? buildPublicCrewPath(crewId) : null;

  useEffect(() => {
    if (!hasValidLogId || !hasValidCrewId) {
      return;
    }

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

        const detail = crewIdNumber
          ? await getCrewLogDetail(crewIdNumber, logIdNumber)
          : await getMeetingLogDetail(logIdNumber);

        if (!isMounted) {
          return;
        }

        setLog(detail);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isCrewScoped &&
          isOperationalError(error) &&
          error.code === "AUTH_ACCESS_DENIED" &&
          publicCrewPath;

        reportOperationalError("log.detail.bootstrap_failed", error, {
          level: shouldRedirect ? "warn" : "warn",
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
            crewId
              ? "크루 방탈로그 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
              : "방탈로그 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [
    crewId,
    crewIdNumber,
    hasValidCrewId,
    hasValidLogId,
    isCrewScoped,
    logIdNumber,
    publicCrewPath,
    routePath,
    router,
  ]);

  function handleCloseLightbox() {
    setSelectedPhotoIndex(null);
  }

  function handleMovePhoto(direction: -1 | 1) {
    setSelectedPhotoIndex((currentIndex) => {
      if (currentIndex == null || !log || log.photos.length === 0) {
        return currentIndex;
      }

      return (currentIndex + direction + log.photos.length) % log.photos.length;
    });
  }

  if (!hasValidLogId || !hasValidCrewId) {
    return (
      <main>
        <h1>{crewId ? "크루 방탈로그 상세" : "방탈로그 상세"}</h1>
        <p>올바른 방탈로그 경로가 아닙니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>{crewId ? "크루 방탈로그 상세를 불러오는 중입니다." : "방탈로그 상세를 불러오는 중입니다."}</p>
      </main>
    );
  }

  if (!log) {
    return (
      <main>
        <h1>{crewId ? "크루 방탈로그 상세" : "방탈로그 상세"}</h1>
        <p>{errorMessage ?? (crewId ? "크루 방탈로그 상세를 불러오지 못했어요." : "방탈로그 상세를 불러오지 못했어요.")}</p>
      </main>
    );
  }

  const previewPhotos = log.photos.slice(0, 3);
  const hasPhotos = log.photos.length > 0;
  const selectedPhoto =
    selectedPhotoIndex != null ? log.photos[selectedPhotoIndex] : null;

  return (
    <main>
      <h1>{crewId ? "크루 방탈로그 상세" : "방탈로그 상세"}</h1>
      <p>{log.meetingTitle}</p>
      <p>
        {log.themeName} · {log.place} · {log.date}
      </p>
      <p>작성자 {log.authorNickname}</p>
      <p>기록 시간 {log.createdAt}</p>
      <p>수정 시간 {log.updatedAt}</p>

      {hasPhotos ? (
        <section aria-label="방탈로그 사진" style={{ marginTop: 16 }}>
          <h2>사진</h2>
          <div
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(220px, 240px)",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {previewPhotos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => setSelectedPhotoIndex(index)}
                aria-label={`사진 ${index + 1} 보기`}
                style={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${log.themeName} 방탈로그 사진 ${index + 1}`}
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              </button>
            ))}
          </div>
          <p>
            {selectedPhotoIndex == null ? `1 / ${log.photos.length}` : `${selectedPhotoIndex + 1} / ${log.photos.length}`}
          </p>
        </section>
      ) : null}

      <section aria-label="방탈로그 본문" style={{ marginTop: 16 }}>
        <h2>기록 내용</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{log.body}</p>
      </section>

      {selectedPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="방탈로그 사진 크게 보기"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              width: "100%",
              display: "grid",
              gap: 16,
              justifyItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => handleMovePhoto(-1)}>
                이전 사진
              </button>
              <button type="button" onClick={() => handleMovePhoto(1)}>
                다음 사진
              </button>
              <button type="button" onClick={handleCloseLightbox}>
                닫기
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt={`${log.themeName} 방탈로그 크게 보기 ${selectedPhotoIndex! + 1}`}
              style={{
                width: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 16,
                background: "#111",
              }}
            />
            <p>{selectedPhotoIndex! + 1} / {log.photos.length}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
