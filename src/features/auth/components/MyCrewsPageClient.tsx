"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMe, getMyCrews } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { MyCrewListItem, MyCrewVisibility } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const MY_CREWS_PATH = "/profile/crews";
const PAGE_SIZE = 20;

function mergeItems(previousItems: MyCrewListItem[], nextItems: MyCrewListItem[]): MyCrewListItem[] {
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

function toVisibilityLabel(visibility: MyCrewVisibility): string {
  switch (visibility) {
    case "PUBLIC":
      return "공개";
    case "PRIVATE":
      return "비공개";
    default:
      return visibility;
  }
}

export function MyCrewsPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<MyCrewListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<number[]>([]);

  async function loadFirstPage() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMyCrews({
        page: 0,
        size: PAGE_SIZE,
      });

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setFailedImageIds([]);
    } catch (error) {
      reportOperationalError("auth.my_crews.bootstrap_failed", error, {
        route: MY_CREWS_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
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

        const destination = resolveProtectedDestination(me, MY_CREWS_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage();
      } catch (error) {
        reportOperationalError("auth.my_crews.auth_failed", error, {
          route: MY_CREWS_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
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
      const response = await getMyCrews({
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.my_crews.load_more_failed", error, {
        level: "warn",
        route: MY_CREWS_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "소속 크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleImageError(crewId: number) {
    setFailedImageIds((currentIds) => (currentIds.includes(crewId) ? currentIds : [...currentIds, crewId]));
  }

  if (isLoading) {
    return (
      <main>
        <h1>소속 크루</h1>
        <p>소속 크루 목록을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>소속 크루</h1>
      <p>지금 함께 활동 중인 크루를 다시 확인하고, 바로 기존 크루 페이지로 이어갈 수 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}

      {!errorMessage && items.length === 0 ? (
        <section style={{ display: "grid", gap: 12 }}>
          <p>아직 소속된 크루가 없어요.</p>
          <div>
            <Link href="/crews/public">공개 크루 탐색</Link>
          </div>
        </section>
      ) : null}

      {items.length > 0 ? (
        <>
          <ul
            aria-label="소속 크루 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {items.map((item) => {
              const shouldShowImage = item.coverImageUrl && !failedImageIds.includes(item.crewId);

              return (
                <li key={item.crewId}>
                  <Link
                    href={`/crews/${item.crewId}`}
                    style={{
                      display: "grid",
                      gap: 12,
                      padding: 16,
                      border: "1px solid #d9d9d9",
                      borderRadius: 16,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#f5f5f5",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {shouldShowImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImageUrl ?? ""}
                          alt={`${item.crewName} 대표 이미지`}
                          onError={() => handleImageError(item.crewId)}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span>크루 이미지 준비 중</span>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>{item.crewName}</strong>
                        <span>{toVisibilityLabel(item.visibility)}</span>
                      </div>
                      <span>{`크루장 ${item.leaderNickname}`}</span>
                    </div>
                  </Link>
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
  );
}
