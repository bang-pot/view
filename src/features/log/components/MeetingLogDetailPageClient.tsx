"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  deleteMeetingLog,
  getCrewLogDetail,
  getMyMeetingLog,
} from "@/shared/log/client";
import type { MeetingLogDetail, MeetingLogMeResponse } from "@/shared/log/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type MeetingLogDetailPageClientProps = {
  logId: string;
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function getDeleteSuccessNotice(deletedBy: "AUTHOR" | "LEADER"): string {
  return deletedBy === "AUTHOR" ? "deleted-own-log" : "deleted-crew-log";
}

export function MeetingLogDetailPageClient({
  logId,
  crewId,
}: MeetingLogDetailPageClientProps) {
  const router = useRouter();
  const [log, setLog] = useState<MeetingLogDetail | null>(null);
  const [myMeetingLog, setMyMeetingLog] = useState<MeetingLogMeResponse | null>(null);
  const [crewRole, setCrewRole] = useState<string | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [leaderDeleteReason, setLeaderDeleteReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const logIdNumber = Number(logId);
  const crewIdNumber = Number(crewId);
  const hasValidLogId = Number.isFinite(logIdNumber);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/logs/${logId}`, [crewId, logId]);
  const feedPath = useMemo(() => `/crews/${crewId}/logs`, [crewId]);
  const publicCrewPath = buildPublicCrewPath(crewId);

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

        setCurrentUserNickname(me.user?.nickname ?? null);

        const [crew, detail] = await Promise.all([
          getCrewHub(crewIdNumber),
          getCrewLogDetail(crewIdNumber, logIdNumber),
        ]);

        if (!isMounted) {
          return;
        }

        let nextMyMeetingLog: MeetingLogMeResponse | null = null;

        try {
          nextMyMeetingLog = await getMyMeetingLog(detail.meetingId);
        } catch (error) {
          reportOperationalError("log.detail.my_log_lookup_failed", error, {
            level: "warn",
            route: routePath,
          });
        }

        if (!isMounted) {
          return;
        }

        setCrewRole(crew.myRole ?? null);
        setMyMeetingLog(nextMyMeetingLog);
        setLog(detail);

        setErrorMessage(null);
        setDeleteErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
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

  function handleOpenDeleteModal() {
    setDeleteErrorMessage(null);
    setLeaderDeleteReason("");
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeleteErrorMessage(null);
    setLeaderDeleteReason("");
    setIsDeleteModalOpen(false);
  }

  async function handleDelete() {
    if (!log || !crewIdNumber) {
      return;
    }

    const isLeaderDelete = canDeleteAsLeader;
    const trimmedDeleteReason = leaderDeleteReason.trim();

    if (isLeaderDelete && trimmedDeleteReason.length === 0) {
      setDeleteErrorMessage("삭제 사유를 입력해 주세요.");
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const response = await deleteMeetingLog(
        crewIdNumber,
        logIdNumber,
        isLeaderDelete ? trimmedDeleteReason : undefined,
      );

      router.push(`${feedPath}?notice=${getDeleteSuccessNotice(response.deletedBy)}`);
    } catch (error) {
      reportOperationalError("log.detail.delete_failed", error, {
        level: "warn",
        route: routePath,
      });

      setDeleteErrorMessage(
        getUserMessage(error, "방탈로그를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
      setIsDeleting(false);
    }
  }

  if (!hasValidLogId || !hasValidCrewId) {
    return (
      <main>
        <h1>크루 방탈로그 상세</h1>
        <p>올바른 방탈로그 경로가 아니에요.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>크루 방탈로그 상세를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (!log) {
    return (
      <main>
        <h1>크루 방탈로그 상세</h1>
        <p>{errorMessage ?? "크루 방탈로그 상세를 불러오지 못했어요."}</p>
      </main>
    );
  }

  const previewPhotos = log.photos.slice(0, 3);
  const hasPhotos = log.photos.length > 0;
  const selectedPhoto =
    selectedPhotoIndex != null ? log.photos[selectedPhotoIndex] : null;
  const isAuthor =
    (myMeetingLog?.status === "EXISTS" && myMeetingLog.logId === logIdNumber) ||
    currentUserNickname === log.authorNickname;
  const canDeleteAsLeader = crewRole === "LEADER" && !isAuthor;
  const canDeleteLog = isAuthor || canDeleteAsLeader;
  const selectedPhotoLabel =
    selectedPhotoIndex == null ? `1 / ${log.photos.length}` : `${selectedPhotoIndex + 1} / ${log.photos.length}`;

  return (
    <main>
      <h1>크루 방탈로그 상세</h1>
      <p>{log.meetingTitle}</p>
      <p>
        {log.themeName} / {log.place} / {log.date}
      </p>
      <p>작성자 {log.authorNickname}</p>
      <p>기록 시간 {log.createdAt}</p>
      <p>수정 시간 {log.updatedAt}</p>

      {canDeleteLog ? (
        <section aria-label="방탈로그 관리" style={{ marginTop: 16 }}>
          <button type="button" onClick={handleOpenDeleteModal}>
            삭제
          </button>
        </section>
      ) : null}

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
          <p>{selectedPhotoLabel}</p>
        </section>
      ) : null}

      <section aria-label="방탈로그 본문" style={{ marginTop: 16 }}>
        <h2>기록 내용</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{log.body}</p>
      </section>

      {isDeleteModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={canDeleteAsLeader ? "운영 삭제 확인" : "내 방탈로그 삭제 확인"}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.56)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              display: "grid",
              gap: 12,
            }}
          >
            <h2>{canDeleteAsLeader ? "운영 삭제" : "방탈로그 삭제"}</h2>
            <p>
              {canDeleteAsLeader
                ? "크루장 삭제는 삭제 사유를 꼭 남겨야 해요. 삭제 후 이 로그는 다시 읽을 수 없어요."
                : "삭제 후 이 로그는 다시 읽을 수 없어요. 현재 정책상 같은 모임에 다시 작성할 수도 없어요."}
            </p>
            {canDeleteAsLeader ? (
              <label>
                삭제 사유
                <textarea
                  value={leaderDeleteReason}
                  onChange={(event) => setLeaderDeleteReason(event.target.value)}
                  rows={4}
                  style={{ display: "block", width: "100%", marginTop: 8 }}
                />
              </label>
            ) : null}
            {deleteErrorMessage ? <p>{deleteErrorMessage}</p> : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={handleCloseDeleteModal} disabled={isDeleting}>
                취소
              </button>
              <button type="button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <p>
              {selectedPhotoIndex! + 1} / {log.photos.length}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
