"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActiveCrewSection, PendingCrewSection } from "@/features/auth/components/MyCrewSections";
import { ProfileTopHeader } from "@/features/auth/components/ProfileTopHeader";
import { getMe, getMyCrews, getPendingCrews } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { MyCrewListItem, PendingCrewListItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./MyCrewsPageClient.module.css";

const MY_CREWS_PATH = "/profile/crews";
const PAGE_SIZE = 20;
const LOAD_ERROR_MESSAGE = "소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
const PARTIAL_LOAD_ERROR_MESSAGE =
  "일부 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

function mergeMyCrewItems(
  previousItems: readonly MyCrewListItem[],
  nextItems: readonly MyCrewListItem[],
): MyCrewListItem[] {
  const seen = new Set(previousItems.map((item) => item.crewId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.crewId)) {
      merged.push(item);
      seen.add(item.crewId);
    }
  }

  return merged;
}

function mergePendingCrewItems(
  previousItems: readonly PendingCrewListItem[],
  nextItems: readonly PendingCrewListItem[],
): PendingCrewListItem[] {
  const seen = new Set(previousItems.map((item) => item.joinRequestId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.joinRequestId)) {
      merged.push(item);
      seen.add(item.joinRequestId);
    }
  }

  return merged;
}

export function MyCrewsPageClient() {
  const router = useRouter();
  const [myCrews, setMyCrews] = useState<MyCrewListItem[]>([]);
  const [pendingCrews, setPendingCrews] = useState<PendingCrewListItem[]>([]);
  const [myCrewsPage, setMyCrewsPage] = useState(0);
  const [pendingCrewsPage, setPendingCrewsPage] = useState(0);
  const [hasNextMyCrews, setHasNextMyCrews] = useState(false);
  const [hasNextPendingCrews, setHasNextPendingCrews] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreMyCrews, setIsLoadingMoreMyCrews] = useState(false);
  const [isLoadingMorePendingCrews, setIsLoadingMorePendingCrews] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<number[]>([]);

  async function loadFirstPage(shouldApplyResult: () => boolean = () => true) {
    setIsLoading(true);
    setErrorMessage(null);

    const [pendingResult, myCrewsResult] = await Promise.allSettled([
      getPendingCrews({ page: 0, size: PAGE_SIZE }),
      getMyCrews({ page: 0, size: PAGE_SIZE }),
    ]);

    if (!shouldApplyResult()) {
      return;
    }

    if (pendingResult.status === "fulfilled") {
      const pendingResponse = pendingResult.value;
      setPendingCrews(pendingResponse.items);
      setPendingCrewsPage(pendingResponse.pageInfo.page);
      setHasNextPendingCrews(pendingResponse.pageInfo.hasNext);
    } else {
      reportOperationalError("auth.my_crews.pending_bootstrap_failed", pendingResult.reason, {
        route: MY_CREWS_PATH,
      });
    }

    if (myCrewsResult.status === "fulfilled") {
      const myCrewsResponse = myCrewsResult.value;
      setMyCrews(myCrewsResponse.items);
      setMyCrewsPage(myCrewsResponse.pageInfo.page);
      setHasNextMyCrews(myCrewsResponse.pageInfo.hasNext);
    } else {
      reportOperationalError("auth.my_crews.active_bootstrap_failed", myCrewsResult.reason, {
        route: MY_CREWS_PATH,
      });
    }

    setFailedImageIds([]);

    if (pendingResult.status === "rejected" && myCrewsResult.status === "rejected") {
      setErrorMessage(getUserMessage(myCrewsResult.reason, LOAD_ERROR_MESSAGE));
    } else if (pendingResult.status === "rejected") {
      setErrorMessage(getUserMessage(pendingResult.reason, PARTIAL_LOAD_ERROR_MESSAGE));
    } else if (myCrewsResult.status === "rejected") {
      setErrorMessage(getUserMessage(myCrewsResult.reason, LOAD_ERROR_MESSAGE));
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();
        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, MY_CREWS_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage(() => isMounted);
      } catch (error) {
        reportOperationalError("auth.my_crews.auth_failed", error, { route: MY_CREWS_PATH });
        if (!isMounted) {
          return;
        }

        setErrorMessage(getUserMessage(error, LOAD_ERROR_MESSAGE));
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLoadMoreMyCrews() {
    setIsLoadingMoreMyCrews(true);
    try {
      const response = await getMyCrews({ page: myCrewsPage + 1, size: PAGE_SIZE });
      setMyCrews((currentItems) => mergeMyCrewItems(currentItems, response.items));
      setMyCrewsPage(response.pageInfo.page);
      setHasNextMyCrews(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.my_crews.load_more_failed", error, {
        level: "warn",
        route: MY_CREWS_PATH,
      });
      setErrorMessage(getUserMessage(error, LOAD_ERROR_MESSAGE));
    } finally {
      setIsLoadingMoreMyCrews(false);
    }
  }

  async function handleLoadMorePendingCrews() {
    setIsLoadingMorePendingCrews(true);
    try {
      const response = await getPendingCrews({ page: pendingCrewsPage + 1, size: PAGE_SIZE });
      setPendingCrews((currentItems) => mergePendingCrewItems(currentItems, response.items));
      setPendingCrewsPage(response.pageInfo.page);
      setHasNextPendingCrews(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.my_crews.pending_load_more_failed", error, {
        level: "warn",
        route: MY_CREWS_PATH,
      });
      setErrorMessage(getUserMessage(error, LOAD_ERROR_MESSAGE));
    } finally {
      setIsLoadingMorePendingCrews(false);
    }
  }

  function handleImageError(crewId: number) {
    setFailedImageIds((currentIds) => (currentIds.includes(crewId) ? currentIds : [...currentIds, crewId]));
  }

  if (isLoading) {
    return (
      <>
        <ProfileTopHeader />
        <main className={styles.pageShell}>
          <section className={styles.introSection}>
            <h1>내가 속한 크루</h1>
            <p className={styles.stateText}>소속 크루 목록을 불러오는 중입니다.</p>
          </section>
        </main>
      </>
    );
  }

  const isEmpty = pendingCrews.length === 0 && myCrews.length === 0;

  return (
    <>
      <ProfileTopHeader />
      <main className={styles.pageShell}>
        <section className={styles.introSection} aria-labelledby="my-crews-title">
          <h1 id="my-crews-title">내가 속한 크루</h1>
          <p>내가 소속된 크루들입니다</p>
        </section>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

        {!errorMessage && isEmpty ? (
          <section className={styles.emptyState}>
            <p className={styles.emptyText}>아직 소속된 크루가 없어요.</p>
            <Link href="/crews/public">공개 크루 탐색</Link>
          </section>
        ) : null}

        <PendingCrewSection
          items={pendingCrews}
          hasNext={hasNextPendingCrews}
          isLoadingMore={isLoadingMorePendingCrews}
          failedImageIds={failedImageIds}
          onImageError={handleImageError}
          onLoadMore={handleLoadMorePendingCrews}
        />

        <ActiveCrewSection
          items={myCrews}
          hasNext={hasNextMyCrews}
          isLoadingMore={isLoadingMoreMyCrews}
          failedImageIds={failedImageIds}
          onImageError={handleImageError}
          onLoadMore={handleLoadMoreMyCrews}
        />

        {isEmpty && errorMessage ? (
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              void loadFirstPage();
            }}
          >
            다시 시도
          </button>
        ) : null}
      </main>
    </>
  );
}
