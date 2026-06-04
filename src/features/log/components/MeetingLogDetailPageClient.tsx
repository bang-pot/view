"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import styles from "@/features/crew/components/CrewPageClient.module.css";
import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  deleteMeetingLog,
  getCrewLogDetail,
  getMyMeetingLog,
} from "@/shared/log/client";
import type {
  MeetingLogDetail,
  MeetingLogMeResponse,
  MeetingLogResultInput,
} from "@/shared/log/types";
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

function toResultLabel(result: MeetingLogResultInput): string {
  return result === "SUCCESS" ? "성공" : "실패";
}

function formatLogDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00+09:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const weekday = ["일", "월", "화", "수", "목", "금", "토"][parsedDate.getDay()];

  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일 (${weekday})`;
}

function getAuthorInitial(nickname: string): string {
  return nickname.trim().slice(0, 1).toUpperCase() || "방";
}

export function MeetingLogDetailPageClient({
  logId,
  crewId,
}: MeetingLogDetailPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
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
  const editPath = useMemo(
    () => (log ? `/crews/${crewId}/meetings/${log.meetingId}/log` : feedPath),
    [crewId, feedPath, log],
  );
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

        const [crewResponse, detail] = await Promise.all([
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

        setCrew(crewResponse);
        setCrewRole(crewResponse.myRole ?? null);
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
              ? "크루 방탈로그 상세를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."
              : "방탈로그 상세를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
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
        getUserMessage(error, "방탈로그를 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요."),
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
  const hasHiddenPhotos = log.photos.length > previewPhotos.length;
  const selectedPhoto =
    selectedPhotoIndex != null ? log.photos[selectedPhotoIndex] : null;
  const isAuthor =
    (myMeetingLog?.status === "EXISTS" && myMeetingLog.logId === logIdNumber) ||
    currentUserNickname === log.authorNickname;
  const canDeleteAsLeader = crewRole === "LEADER" && !isAuthor;
  const canDeleteLog = isAuthor || canDeleteAsLeader;
  const workspaceCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="logs" crew={workspaceCrew} crewId={crewId}>
      <section className={styles.logDetailPanel} aria-label="방탈로그 상세">
        <header className={styles.logDetailToolbar}>
          <Link
            className={styles.logDetailBackLink}
            href={feedPath}
            aria-label="방탈로그 목록"
          >
            ← 방탈로그 목록
          </Link>
          <div className={styles.logDetailActions}>
            {isAuthor ? (
              <Link className={styles.logDetailEditLink} href={editPath}>
                수정하기
              </Link>
            ) : null}
            {canDeleteLog ? (
              <button
                className={styles.logDetailDeleteButton}
                type="button"
                onClick={handleOpenDeleteModal}
              >
                삭제
              </button>
            ) : null}
          </div>
        </header>

        <article className={styles.logDetailCard}>
          <header className={styles.logDetailAuthorRow}>
            <span className={styles.logDetailAvatar} aria-hidden="true">
              {getAuthorInitial(log.authorNickname)}
            </span>
            <div>
              <strong>{log.authorNickname}</strong>
              <p>
                [{log.meetingTitle}] · {toResultLabel(log.result)} ·{" "}
                {formatLogDate(log.date)}
              </p>
            </div>
          </header>

          {hasPhotos ? (
            <section className={styles.logDetailPhotoSection} aria-label="방탈로그 사진">
              <div className={styles.logDetailPhotoGrid}>
                {previewPhotos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    className={styles.logDetailPhotoButton}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    aria-label={`사진 ${index + 1} 보기`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`${log.themeName} 방탈로그 사진 ${index + 1}`}
                    />
                  </button>
                ))}
                {hasHiddenPhotos ? (
                  <button
                    className={styles.logDetailPhotoNext}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(previewPhotos.length)}
                    aria-label="다음 사진 보기"
                  >
                    →
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className={styles.logDetailDivider} />

          <section className={styles.logDetailBody} aria-label="방탈로그 본문">
            <h1>[{log.themeName}]</h1>
            <p>{log.body}</p>
          </section>
        </article>
      </section>

      {isDeleteModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={canDeleteAsLeader ? "운영 삭제 확인" : "내 방탈로그 삭제 확인"}
          className={styles.logModalOverlay}
        >
          <div className={styles.logDeleteDialog}>
            <h2>{canDeleteAsLeader ? "운영 삭제" : "방탈로그 삭제"}</h2>
            <p>
              {canDeleteAsLeader
                ? "크루장이 삭제할 때는 삭제 사유를 꼭 남겨야 해요. 삭제 후 로그는 다시 읽을 수 없어요."
                : "삭제 후 로그는 다시 읽을 수 없어요. 현재 모임과 같은 모임에 다시 작성할 수도 없어요."}
            </p>
            {canDeleteAsLeader ? (
              <label>
                삭제 사유
                <textarea
                  value={leaderDeleteReason}
                  onChange={(event) => setLeaderDeleteReason(event.target.value)}
                  rows={4}
                />
              </label>
            ) : null}
            {deleteErrorMessage ? <p>{deleteErrorMessage}</p> : null}
            <div className={styles.logDeleteActions}>
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
          className={styles.logModalOverlay}
        >
          <div className={styles.logLightbox}>
            <div className={styles.logLightboxActions}>
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
            />
            <p>
              {selectedPhotoIndex! + 1} / {log.photos.length}
            </p>
          </div>
        </div>
      ) : null}
    </CrewWorkspaceShell>
  );
}
