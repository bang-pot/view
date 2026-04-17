"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cancelPendingCrew, getMe, getPendingCrews } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { PendingCrewListItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PENDING_CREWS_PATH = "/profile/pending-crews";
const PAGE_SIZE = 20;

function mergeItems(
  previousItems: PendingCrewListItem[],
  nextItems: PendingCrewListItem[],
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

function formatRequestedAt(requestedAt: string): string {
  const matched = requestedAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);

  if (matched) {
    return `${matched[1]} ${matched[2]}`;
  }

  return requestedAt;
}

function toMessageSummary(messageSummary: string | null): string {
  if (!messageSummary || !messageSummary.trim()) {
    return "메시지 없음";
  }

  return messageSummary;
}

export function PendingCrewsPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<PendingCrewListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingCancelItem, setPendingCancelItem] = useState<PendingCrewListItem | null>(null);
  const [cancelingJoinRequestId, setCancelingJoinRequestId] = useState<number | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});

  async function loadFirstPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getPendingCrews({
        page: 0,
        size: PAGE_SIZE,
      });

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setActionErrors({});
    } catch (error) {
      reportOperationalError("auth.pending_crews.bootstrap_failed", error, {
        route: PENDING_CREWS_PATH,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
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

        const destination = resolveProtectedDestination(me, PENDING_CREWS_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage();
      } catch (error) {
        reportOperationalError("auth.pending_crews.auth_failed", error, {
          route: PENDING_CREWS_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
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
      const response = await getPendingCrews({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.pending_crews.load_more_failed", error, {
        level: "warn",
        route: PENDING_CREWS_PATH,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "가입 대기 중 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function openCancelDialog(item: PendingCrewListItem) {
    setActionErrors((currentErrors) => {
      if (!currentErrors[item.joinRequestId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[item.joinRequestId];
      return nextErrors;
    });
    setPendingCancelItem(item);
  }

  function closeCancelDialog() {
    if (cancelingJoinRequestId) {
      return;
    }

    setPendingCancelItem(null);
  }

  async function handleConfirmCancel() {
    if (!pendingCancelItem) {
      return;
    }

    const target = pendingCancelItem;
    setCancelingJoinRequestId(target.joinRequestId);

    try {
      await cancelPendingCrew(target.joinRequestId);

      setItems((currentItems) =>
        currentItems.filter((item) => item.joinRequestId !== target.joinRequestId),
      );
      setActionErrors((currentErrors) => {
        if (!currentErrors[target.joinRequestId]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[target.joinRequestId];
        return nextErrors;
      });
      setPendingCancelItem(null);
    } catch (error) {
      reportOperationalError("auth.pending_crews.cancel_failed", error, {
        level: "warn",
        route: PENDING_CREWS_PATH,
      });
      setActionErrors((currentErrors) => ({
        ...currentErrors,
        [target.joinRequestId]: getUserMessage(
          error,
          "가입 신청 취소에 실패했어요. 잠시 후 다시 시도해 주세요.",
        ),
      }));
    } finally {
      setCancelingJoinRequestId(null);
    }
  }

  if (isLoading) {
    return (
      <main>
        <h1>가입 대기 중 크루</h1>
        <p>가입 대기 중 크루 목록을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <>
      <main style={{ display: "grid", gap: 16 }}>
        <h1>가입 대기 중 크루</h1>
        <p>공개 크루에 보낸 가입 신청을 다시 확인하고, 필요하면 바로 취소할 수 있어요.</p>

        {errorMessage ? <p>{errorMessage}</p> : null}

        {!errorMessage && items.length === 0 ? (
          <section style={{ display: "grid", gap: 12 }}>
            <p>현재 대기 중인 가입 신청이 없어요</p>
            <div>
              <Link href="/crews/public">공개 크루 탐색</Link>
            </div>
          </section>
        ) : null}

        {items.length > 0 ? (
          <>
            <ul
              aria-label="가입 대기 중 크루 목록"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: 12,
              }}
            >
              {items.map((item) => {
                const isCanceling = cancelingJoinRequestId === item.joinRequestId;

                return (
                  <li
                    key={item.joinRequestId}
                    style={{
                      display: "grid",
                      gap: 10,
                      padding: 16,
                      border: "1px solid #d9d9d9",
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>{item.crewName}</strong>
                      <span>{`신청일 ${formatRequestedAt(item.requestedAt)}`}</span>
                      <span>{toMessageSummary(item.messageSummary)}</span>
                    </div>

                    {actionErrors[item.joinRequestId] ? <p>{actionErrors[item.joinRequestId]}</p> : null}

                    <div>
                      <button
                        type="button"
                        onClick={() => openCancelDialog(item)}
                        disabled={isCanceling}
                      >
                        {isCanceling ? "취소하는 중..." : "가입 신청 취소"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {hasNext ? (
              <button type="button" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
              </button>
            ) : (
              <p>여기까지 모두 확인했어요.</p>
            )}
          </>
        ) : null}

        {!items.length && errorMessage ? (
          <button type="button" onClick={handleRetry}>
            다시 시도
          </button>
        ) : null}
      </main>

      {pendingCancelItem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-cancel-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              width: "min(100%, 420px)",
              display: "grid",
              gap: 12,
              padding: 20,
              borderRadius: 16,
              background: "#fff",
            }}
          >
            <h2 id="pending-cancel-title">정말 취소하시겠어요?</h2>
            <p>{`${pendingCancelItem.crewName} 가입 신청을 취소하면 다시 신청해야 해요.`}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={cancelingJoinRequestId === pendingCancelItem.joinRequestId}
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelingJoinRequestId === pendingCancelItem.joinRequestId}
              >
                {cancelingJoinRequestId === pendingCancelItem.joinRequestId ? "처리 중..." : "확인"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
