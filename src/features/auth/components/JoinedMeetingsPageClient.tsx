"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { JoinedMeetingCard } from "@/features/auth/components/JoinedMeetingCard";
import { ProfileTopHeader } from "@/features/auth/components/ProfileTopHeader";
import { getJoinedMeetings, getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import type { JoinedMeetingListItem } from "@/shared/auth/types";

import styles from "./JoinedMeetingsPageClient.module.css";

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

function isPastMeeting(item: JoinedMeetingListItem): boolean {
  return item.status === "COMPLETED" || item.status === "CANCELED";
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
      <>
        <ProfileTopHeader />
        <main className={styles.pageShell}>
          <section className={styles.introSection} aria-labelledby="joined-meetings-title">
            <h1 id="joined-meetings-title">내가 참여한 모임</h1>
            <p>내가 참여한 모든 모임입니다.</p>
          </section>
          <p className={styles.stateText}>참여 모임 목록을 불러오는 중입니다.</p>
        </main>
      </>
    );
  }

  const activeItems = items.filter((item) => !isPastMeeting(item));
  const pastItems = items.filter(isPastMeeting);

  return (
    <>
      <ProfileTopHeader />
      <main className={styles.pageShell}>
        <section className={styles.introSection} aria-labelledby="joined-meetings-title">
          <h1 id="joined-meetings-title">내가 참여한 모임</h1>
          <p>내가 참여한 모든 모임입니다.</p>
        </section>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

        {!errorMessage && items.length === 0 ? (
          <p className={styles.emptyState}>아직 참여한 모임이 없어요.</p>
        ) : null}

        {activeItems.length > 0 ? (
          <section className={styles.meetingSection} aria-labelledby="active-meetings-title">
            <h2 id="active-meetings-title">진행 중 모임</h2>
            <ul className={styles.meetingList} aria-label="진행 중 참여 모임 목록">
              {activeItems.map((item) => (
                <JoinedMeetingCard key={item.meetingId} item={item} />
              ))}
            </ul>
          </section>
        ) : null}

        {pastItems.length > 0 ? (
          <section className={styles.meetingSection} aria-labelledby="past-meetings-title">
            <h2 id="past-meetings-title">지난 모임</h2>
            <ul className={styles.meetingList} aria-label="지난 참여 모임 목록">
              {pastItems.map((item) => (
                <JoinedMeetingCard key={item.meetingId} item={item} />
              ))}
            </ul>
          </section>
        ) : null}

        {items.length > 0 && hasNext ? (
          <div className={styles.moreAction}>
            <button type="button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
            </button>
          </div>
        ) : null}

        {items.length > 0 && !hasNext ? (
          <p className={styles.endMessage}>여기까지 모두 확인했어요.</p>
        ) : null}

        {!items.length && errorMessage ? (
          <div>
            <button className={styles.retryButton} type="button" onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        ) : null}
      </main>
    </>
  );
}
