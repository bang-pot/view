"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyMeetingLogs } from "@/shared/auth/client";
import type { MyMeetingLogListItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ProfilePageClient.module.css";

const LOGS_ROUTE = "/profile/logs";
const LOG_PREVIEW_LIMIT = 3;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const weekday = WEEKDAY_LABELS[date.getDay()] ?? "";
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

function toExcerpt(value: string | null): string {
  return value && value.trim().length > 0 ? value : "아직 작성된 내용이 없어요.";
}

function toInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "방";
}

function toResultLabel(result: MyMeetingLogListItem["result"]): string {
  switch (result) {
    case "SUCCESS":
      return "성공";
    case "FAILURE":
      return "실패";
  }
}

type ProfileMeetingLogsSummarySectionProps = {
  readonly authorName: string;
};

export function ProfileMeetingLogsSummarySection({ authorName }: ProfileMeetingLogsSummarySectionProps) {
  const [items, setItems] = useState<MyMeetingLogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageLogIds, setFailedImageLogIds] = useState<number[]>([]);

  async function loadLogs() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMyMeetingLogs({ page: 0, size: LOG_PREVIEW_LIMIT });
      setItems(response.items);
      setFailedImageLogIds([]);
    } catch (error) {
      reportOperationalError("auth.profile.logs_summary_failed", error, {
        route: "/profile",
      });
      setErrorMessage(
        getUserMessage(error, "방팟 로그를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  function markImageFailed(logId: number) {
    setFailedImageLogIds((currentIds) =>
      currentIds.includes(logId) ? currentIds : [...currentIds, logId],
    );
  }

  return (
    <section className={styles.panelCard} aria-label="방팟 로그">
      <div className={styles.sectionHeader}>
        <h2>방팟 로그</h2>
        <Link href={LOGS_ROUTE} aria-label="방팟 로그 전체보기" className={styles.viewAllLink}>
          전체보기 ▪
        </Link>
      </div>

      {isLoading ? <p className={styles.stateText}>방팟 로그를 불러오는 중입니다.</p> : null}

      {!isLoading && errorMessage ? (
        <div className={styles.emptyState}>
          <p>{errorMessage}</p>
          <button type="button" className={styles.secondaryButton} onClick={() => void loadLogs()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <p className={styles.stateText}>아직 작성한 방팟 로그가 없어요.</p>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <ul className={styles.logList} aria-label="방팟 로그 목록">
          {items.map((item) => {
            const canShowCoverImage =
              item.coverPhotoUrl !== null && !failedImageLogIds.includes(item.logId);
            const hasMedia = canShowCoverImage || item.photoCount > 0;

            return (
              <li key={item.logId}>
                <Link
                  href={`/crews/${item.crewId}/logs/${item.logId}`}
                  className={`${styles.logItem} ${hasMedia ? styles.logItemWithMedia : styles.logItemTextOnly}`}
                >
                  {hasMedia ? (
                    <div
                      className={styles.logThumb}
                      aria-hidden={canShowCoverImage ? undefined : true}
                    >
                      {canShowCoverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverPhotoUrl ?? ""}
                          alt={`${item.meetingTitle} 대표 사진`}
                          onError={() => markImageFailed(item.logId)}
                        />
                      ) : (
                        <span className={styles.logThumbPlaceholder} />
                      )}
                      {item.photoCount > 1 ? (
                        <span className={styles.logPhotoBadge}>+{item.photoCount}장</span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className={styles.logBody}>
                    <p className={styles.logContent}>
                      <span>[테마이름]</span> {toExcerpt(item.excerpt)}
                    </p>
                    <div className={styles.logFooter}>
                      <span className={styles.logAuthor}>
                        <span className={styles.logAuthorAvatar}>{toInitial(authorName)}</span>
                        <strong>{authorName}</strong>
                      </span>
                      <span className={styles.logMeta}>
                        [{item.meetingTitle}] · {toResultLabel(item.result)} ·{" "}
                        {formatShortDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
