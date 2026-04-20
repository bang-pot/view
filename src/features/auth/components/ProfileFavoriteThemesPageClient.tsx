"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ThemeFavoriteButton } from "@/features/explore/components/ThemeFavoriteButton";
import { getFavoriteThemes, getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { FavoriteThemeListItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PROFILE_FAVORITES_PATH = "/profile/favorites";
const PAGE_SIZE = 20;

function mergeItems(
  previousItems: FavoriteThemeListItem[],
  nextItems: FavoriteThemeListItem[],
): FavoriteThemeListItem[] {
  const seen = new Set(previousItems.map((item) => item.themeId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.themeId)) {
      merged.push(item);
      seen.add(item.themeId);
    }
  }

  return merged;
}

export function ProfileFavoriteThemesPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [items, setItems] = useState<FavoriteThemeListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<number[]>([]);

  const loadPage = useCallback(async (targetPage: number) => {
    return getFavoriteThemes({
      page: targetPage,
      size: PAGE_SIZE,
    });
  }, []);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loadPage(0);

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setFailedImageIds([]);
    } catch (error) {
      reportOperationalError("auth.favorite_themes.bootstrap_failed", error, {
        route: PROFILE_FAVORITES_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadPage]);

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

        const destination = resolveProtectedDestination(me, PROFILE_FAVORITES_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadFirstPage();
      } catch (error) {
        reportOperationalError("auth.favorite_themes.auth_failed", error, {
          route: PROFILE_FAVORITES_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadFirstPage, router]);

  async function handleRetry() {
    await loadFirstPage();
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const response = await loadPage(page + 1);

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("auth.favorite_themes.load_more_failed", error, {
        level: "warn",
        route: PROFILE_FAVORITES_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleImageError(themeId: number) {
    setFailedImageIds((currentIds) =>
      currentIds.includes(themeId) ? currentIds : [...currentIds, themeId],
    );
  }

  function handleFavoriteChange(input: { themeId: number; isFavorite: boolean }) {
    if (input.isFavorite) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.themeId !== input.themeId));
  }

  if (isLoading) {
    return (
      <main>
        <h1>찜한 테마</h1>
        <p>찜한 테마 목록을 불러오는 중입니다.</p>
      </main>
    );
  }

  const showEmptyState = !errorMessage && items.length === 0;

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>찜한 테마</h1>
      <p>최근에 저장한 테마를 최신순으로 다시 확인하고, 기존 테마 상세로 바로 이어서 볼 수 있어요.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}

      {showEmptyState ? (
        <section style={{ display: "grid", gap: 12 }}>
          <p>아직 찜한 테마가 없어요</p>
          <div>
            <Link href="/explore">테마 둘러보기</Link>
          </div>
        </section>
      ) : null}

      {items.length > 0 ? (
        <>
          <ul
            aria-label="찜한 테마 목록"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {items.map((item) => {
              const shouldShowImage = item.thumbnailUrl && !failedImageIds.includes(item.themeId);
              const detailPath = `/explore/themes/${item.themeId}`;

              return (
                <li
                  key={item.themeId}
                  style={{
                    display: "grid",
                    gap: 12,
                    padding: 16,
                    border: "1px solid #d9d9d9",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Link
                      href={detailPath}
                      style={{
                        flex: 1,
                        display: "grid",
                        gap: 12,
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
                            src={item.thumbnailUrl ?? ""}
                            alt={`${item.themeName} 썸네일`}
                            onError={() => handleImageError(item.themeId)}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span>테마 이미지 준비 중</span>
                        )}
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <strong>{item.themeName}</strong>
                        <span>{item.storeName}</span>
                        <span>{item.regionName}</span>
                      </div>
                    </Link>

                    <ThemeFavoriteButton
                      themeId={item.themeId}
                      initialIsFavorite={item.isFavorite}
                      initialFavoriteCount={item.favoriteCount}
                      redirectPath={PROFILE_FAVORITES_PATH}
                      variant="compact"
                      onChange={(nextState) =>
                        handleFavoriteChange({
                          themeId: item.themeId,
                          isFavorite: nextState.isFavorite,
                        })
                      }
                    />
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
  );
}
