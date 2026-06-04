"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getJoinedMeetings, getMe } from "@/shared/auth/client";
import type { JoinedMeetingListItem } from "@/shared/auth/types";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewLogFeed } from "@/shared/log/client";
import type { CrewLogFeedItem } from "@/shared/log/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";
import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import crewWorkspaceStyles from "@/features/crew/components/CrewPageClient.module.css";

type CrewLogFeedPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 20;
const MEETING_PICKER_API_PAGE_SIZE = 20;
const MEETING_PICKER_PAGE_SIZE = 4;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function buildCrewLogDetailPath(crewId: string, logId: number): string {
  return `/crews/${crewId}/logs/${logId}`;
}

function buildMeetingLogEditorPath(crewId: string, meetingId: number): string {
  return `/crews/${crewId}/meetings/${meetingId}/log`;
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

function getFeedExcerpt(item: CrewLogFeedItem): string {
  return `[${item.themeName}] ${getExcerpt(item.excerpt)}`;
}

function getMeetingPickerTitle(item: JoinedMeetingListItem): string {
  return item.themeName.trim() || item.title;
}

function getMeetingPickerDateLabel(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const weekday = WEEKDAY_LABELS[parsedDate.getDay()];

  return `${year}.${month}.${day} (${weekday})`;
}

function getMeetingPickerParticipantLabel(item: JoinedMeetingListItem): string {
  if (typeof item.participantCount === "number") {
    return `${item.participantCount}명 참여`;
  }

  if (typeof item.capacity === "number") {
    return `${item.capacity}명 정원`;
  }

  return "참여 완료";
}

function isWritableCrewMeeting(item: JoinedMeetingListItem, crewId: number): boolean {
  return item.crewId === crewId && item.status === "COMPLETED" && item.canWriteReview;
}

function toResultLabel(result: CrewLogFeedItem["result"]): string {
  if (result === "SUCCESS") {
    return "성공";
  }
  if (result === "FAILURE") {
    return "실패";
  }
  return "결과 대기";
}

function toFeedMeta(item: CrewLogFeedItem): string {
  return `[${item.meetingTitle}] · ${toResultLabel(item.result)} · ${item.meetingDate}`;
}

function LogPlaceholderGrid() {
  return (
    <ul className={crewWorkspaceStyles.placeholderGrid} aria-label="방탈로그 미리보기">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={`log-placeholder-${index + 1}`}>
          <article className={crewWorkspaceStyles.placeholderCard}>
            <div className={crewWorkspaceStyles.placeholderImage}>기록 준비 중</div>
            <div className={crewWorkspaceStyles.placeholderMeta}>
              <strong>방탈로그 {index + 1}</strong>
              <span>크루 기록이 등록되면 이곳에 보여요.</span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

type MeetingLogPickerModalProps = {
  errorMessage: string | null;
  isLoading: boolean;
  items: JoinedMeetingListItem[];
  onClose: () => void;
  onPageChange: (page: number) => void;
  onSelect: (meetingId: number) => void;
  onSubmit: () => void;
  page: number;
  selectedMeetingId: number | null;
};

function MeetingLogPickerModal({
  errorMessage,
  isLoading,
  items,
  onClose,
  onPageChange,
  onSelect,
  onSubmit,
  page,
  selectedMeetingId,
}: MeetingLogPickerModalProps) {
  const pageCount = Math.max(1, Math.ceil(items.length / MEETING_PICKER_PAGE_SIZE));
  const resolvedPage = Math.min(page, pageCount - 1);
  const visibleItems = items.slice(
    resolvedPage * MEETING_PICKER_PAGE_SIZE,
    resolvedPage * MEETING_PICKER_PAGE_SIZE + MEETING_PICKER_PAGE_SIZE,
  );
  const isSubmitDisabled = isLoading || selectedMeetingId === null;
  const hasMultiplePages = pageCount > 1;
  const handlePreviousPage = () => onPageChange(Math.max(0, resolvedPage - 1));
  const handleNextPage = () => onPageChange(Math.min(pageCount - 1, resolvedPage + 1));

  return (
    <div className={crewWorkspaceStyles.logModalOverlay} onClick={onClose}>
      <section
        aria-label="참여한 모임 리스트"
        aria-modal="true"
        className={crewWorkspaceStyles.meetingLogPickerDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={crewWorkspaceStyles.meetingLogPickerHeader}>
          <h2>참여한 모임 리스트</h2>
          <button
            type="button"
            aria-label="닫기"
            className={crewWorkspaceStyles.meetingLogPickerCloseButton}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={crewWorkspaceStyles.meetingLogPickerBody}>
          <p>방탈 로그를 작성할 완료된 방탈 모집을 선택해 주세요.</p>

          {isLoading ? (
            <p className={crewWorkspaceStyles.meetingLogPickerState}>
              참여한 모임을 불러오는 중입니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p className={crewWorkspaceStyles.meetingLogPickerState}>{errorMessage}</p>
          ) : null}
          {!isLoading && !errorMessage && items.length === 0 ? (
            <p className={crewWorkspaceStyles.meetingLogPickerState}>
              로그를 작성할 수 있는 완료된 모임이 없어요.
            </p>
          ) : null}

          {!isLoading && !errorMessage && visibleItems.length > 0 ? (
            <ul className={crewWorkspaceStyles.meetingLogPickerList}>
              {visibleItems.map((item) => {
                const title = getMeetingPickerTitle(item);
                const isSelected = selectedMeetingId === item.meetingId;

                return (
                  <li key={item.meetingId}>
                    <button
                      type="button"
                      aria-label={`${title} 선택`}
                      aria-pressed={isSelected}
                      className={crewWorkspaceStyles.meetingLogPickerItem}
                      data-selected={isSelected ? "true" : "false"}
                      onClick={() => onSelect(item.meetingId)}
                    >
                      <span
                        aria-hidden="true"
                        className={crewWorkspaceStyles.meetingLogPickerRadio}
                      />
                      <span className={crewWorkspaceStyles.meetingLogPickerInfo}>
                        <strong>{title}</strong>
                        <span>
                          {getMeetingPickerDateLabel(item.date)} ·{" "}
                          {getMeetingPickerParticipantLabel(item)}
                        </span>
                      </span>
                      <span className={crewWorkspaceStyles.meetingLogPickerStatus}>완료</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {hasMultiplePages ? (
            <nav
              aria-label="참여 모임 페이지 이동"
              className={crewWorkspaceStyles.meetingLogPickerInlinePagination}
            >
              <button
                type="button"
                aria-label="이전"
                className={crewWorkspaceStyles.meetingLogPickerArrowButton}
                disabled={resolvedPage === 0}
                onClick={handlePreviousPage}
              >
                ‹
              </button>
              <div className={crewWorkspaceStyles.meetingLogPickerPagination}>
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={`meeting-picker-page-${index + 1}`}
                    type="button"
                    aria-current={index === resolvedPage ? "page" : undefined}
                    aria-label={`${index + 1}페이지`}
                    className={crewWorkspaceStyles.meetingLogPickerDot}
                    data-active={index === resolvedPage ? "true" : "false"}
                    onClick={() => onPageChange(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="다음"
                className={crewWorkspaceStyles.meetingLogPickerArrowButton}
                disabled={resolvedPage >= pageCount - 1}
                onClick={handleNextPage}
              >
                ›
              </button>
            </nav>
          ) : null}
        </div>

        <footer
          aria-label="방탈로그 작성 액션"
          className={crewWorkspaceStyles.meetingLogPickerFooter}
        >
          <div className={crewWorkspaceStyles.meetingLogPickerActions}>
            <Button
              type="button"
              size="md"
              variant="primary"
              className={crewWorkspaceStyles.meetingLogPickerSubmitButton}
              disabled={isSubmitDisabled}
              onClick={onSubmit}
            >
              로그 작성하기
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function LogFeedHeader({ onOpenMeetingPicker }: { onOpenMeetingPicker: () => void }) {
  return (
    <header className={crewWorkspaceStyles.logFeedHeader}>
      <h1>방탈로그</h1>
      <Button
        type="button"
        size="sm"
        variant="primary"
        className={crewWorkspaceStyles.logWriteButton}
        leftIcon={<span className={crewWorkspaceStyles.squareIcon} aria-hidden="true" />}
        onClick={onOpenMeetingPicker}
      >
        로그 작성하기
      </Button>
    </header>
  );
}

export function CrewLogFeedPageClient({ crewId }: CrewLogFeedPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [items, setItems] = useState<CrewLogFeedItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMeetingPickerOpen, setIsMeetingPickerOpen] = useState(false);
  const [isMeetingPickerLoading, setIsMeetingPickerLoading] = useState(false);
  const [meetingPickerErrorMessage, setMeetingPickerErrorMessage] = useState<string | null>(null);
  const [meetingPickerItems, setMeetingPickerItems] = useState<JoinedMeetingListItem[]>([]);
  const [meetingPickerPage, setMeetingPickerPage] = useState(0);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/logs`;
  const publicCrewPath = buildPublicCrewPath(crewId);
  const notice = searchParams.get("notice");
  const noticeMessage =
    notice === "deleted-own-log" || notice === "deleted-crew-log"
      ? "방탈로그를 삭제했어요."
      : null;

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsLoadingMore(false);
    setErrorMessage(null);

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

        const [crewResult, feedResult] = await Promise.allSettled([
          getCrewHub(crewIdNumber),
          getCrewLogFeed(crewIdNumber, {
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

        if (feedResult.status !== "fulfilled") {
          throw feedResult.reason;
        }

        const response = feedResult.value;
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

  async function handleOpenMeetingPicker() {
    setIsMeetingPickerOpen(true);
    setIsMeetingPickerLoading(true);
    setMeetingPickerErrorMessage(null);
    setMeetingPickerPage(0);

    try {
      const response = await getJoinedMeetings({
        page: 0,
        size: MEETING_PICKER_API_PAGE_SIZE,
      });
      const writableMeetings = response.items.filter((item) =>
        isWritableCrewMeeting(item, crewIdNumber),
      );

      setMeetingPickerItems(writableMeetings);
      setSelectedMeetingId((currentMeetingId) => {
        if (
          currentMeetingId !== null &&
          writableMeetings.some((item) => item.meetingId === currentMeetingId)
        ) {
          return currentMeetingId;
        }

        return writableMeetings[0]?.meetingId ?? null;
      });
    } catch (error) {
      reportOperationalError("crew.log_feed.joined_meetings_load_failed", error, {
        level: "warn",
        route: routePath,
      });
      setMeetingPickerItems([]);
      setSelectedMeetingId(null);
      setMeetingPickerErrorMessage(
        getUserMessage(error, "참여한 모임 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsMeetingPickerLoading(false);
    }
  }

  function handleCloseMeetingPicker() {
    setIsMeetingPickerOpen(false);
  }

  function handleSubmitMeetingPicker() {
    if (selectedMeetingId === null) {
      return;
    }

    router.push(buildMeetingLogEditorPath(crewId, selectedMeetingId));
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루 방탈로그</h1>
        <p>올바른 크루 경로가 아닙니다.</p>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);
  const meetingPickerModal = isMeetingPickerOpen ? (
    <MeetingLogPickerModal
      errorMessage={meetingPickerErrorMessage}
      isLoading={isMeetingPickerLoading}
      items={meetingPickerItems}
      onClose={handleCloseMeetingPicker}
      onPageChange={setMeetingPickerPage}
      onSelect={setSelectedMeetingId}
      onSubmit={handleSubmitMeetingPicker}
      page={meetingPickerPage}
      selectedMeetingId={selectedMeetingId}
    />
  ) : null;

  if (isLoading) {
    return (
      <CrewWorkspaceShell activeMenu="logs" crew={resolvedCrew} crewId={crewId}>
        <section
          aria-hidden={isMeetingPickerOpen ? true : undefined}
          className={`${crewWorkspaceStyles.tabPanel} ${crewWorkspaceStyles.logFeedPanel}`}
        >
          <LogFeedHeader onOpenMeetingPicker={handleOpenMeetingPicker} />
          <p>크루 방탈로그 피드를 불러오는 중입니다.</p>
        </section>
        {meetingPickerModal}
      </CrewWorkspaceShell>
    );
  }

  return (
    <CrewWorkspaceShell activeMenu="logs" crew={resolvedCrew} crewId={crewId}>
      <section
        aria-hidden={isMeetingPickerOpen ? true : undefined}
        className={`${crewWorkspaceStyles.tabPanel} ${crewWorkspaceStyles.logFeedPanel}`}
      >
      <LogFeedHeader onOpenMeetingPicker={handleOpenMeetingPicker} />

      {noticeMessage ? <p>{noticeMessage}</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? (
        <>
          <p>아직 등록된 방탈로그가 없어요.</p>
          <LogPlaceholderGrid />
        </>
      ) : null}

      {!errorMessage && items.length > 0 ? (
        <>
          <ul
            aria-label="크루 방탈로그 피드"
            className={crewWorkspaceStyles.crewLogFeedList}
          >
            {items.map((item) => (
              <li key={item.logId}>
                <Link
                  href={buildCrewLogDetailPath(crewId, item.logId)}
                  className={crewWorkspaceStyles.crewLogFeedCard}
                  data-has-cover={item.coverPhotoUrl ? "true" : "false"}
                  data-result={item.result}
                >
                  {item.coverPhotoUrl ? (
                    <div className={crewWorkspaceStyles.crewLogCover}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.coverPhotoUrl}
                        alt={`${item.meetingTitle} 대표 사진`}
                      />
                      {item.extraPhotoCount > 0 ? (
                        <span>+{item.extraPhotoCount}장</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={crewWorkspaceStyles.crewLogContent}>
                    <p>{getFeedExcerpt(item)}</p>
                    <div className={crewWorkspaceStyles.crewLogFooter}>
                      <span className={crewWorkspaceStyles.crewLogAuthor}>
                        <span aria-hidden="true">{item.authorNickname.slice(0, 1)}</span>
                        <strong>{item.authorNickname}</strong>
                      </span>
                      <span className={crewWorkspaceStyles.crewLogMeta}>{toFeedMeta(item)}</span>
                    </div>
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
      </section>
      {meetingPickerModal}
    </CrewWorkspaceShell>
  );
}
