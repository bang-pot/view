"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProfileFavoriteThemeListItem } from "@/features/auth/components/ProfileFavoriteThemeListItem";
import { ProfileTopHeader } from "@/features/auth/components/ProfileTopHeader";
import { ExploreThemeDetailDialog } from "@/features/explore/components/ExploreThemeDetailDialog";
import { getFavoriteThemes, getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { FavoriteThemeListItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { getExploreThemeDetail } from "@/shared/explore/client";
import type { ExploreThemeDetail } from "@/shared/explore/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ProfileFavoriteThemesPageClient.module.css";

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
  const [items, setItems] = useState<FavoriteThemeListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<number[]>([]);
  const [selectedThemeDetail, setSelectedThemeDetail] = useState<ExploreThemeDetail | null>(null);
  const [isThemeDetailLoading, setIsThemeDetailLoading] = useState(false);
  const [themeDetailErrorMessage, setThemeDetailErrorMessage] = useState<string | null>(null);

  const loadPage = useCallback(async (targetPage: number) => {
    return getFavoriteThemes({
      page: targetPage,
      size: PAGE_SIZE,
    });
  }, []);

  const loadFirstPage = useCallback(async (shouldApplyResult: () => boolean = () => true) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loadPage(0);

      if (!shouldApplyResult()) {
        return;
      }

      setItems(response.items);
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setFailedImageIds([]);
    } catch (error) {
      reportOperationalError("auth.favorite_themes.bootstrap_failed", error, {
        route: PROFILE_FAVORITES_PATH,
      });
      if (!shouldApplyResult()) {
        return;
      }

      setErrorMessage(
        getUserMessage(error, "찜한 테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      if (!shouldApplyResult()) {
        return;
      }

      setIsLoading(false);
    }
  }, [loadPage]);

  useEffect(() => {
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

        await loadFirstPage(() => isMounted);
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

  async function handleOpenThemeDetail(themeId: number) {
    setThemeDetailErrorMessage(null);
    setIsThemeDetailLoading(true);

    try {
      const response = await getExploreThemeDetail(themeId);

      setSelectedThemeDetail(response);
    } catch (error) {
      reportOperationalError("auth.favorite_themes.detail_load_failed", error, {
        level: "warn",
        route: PROFILE_FAVORITES_PATH,
      });
      setThemeDetailErrorMessage(
        getUserMessage(error, "테마 상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsThemeDetailLoading(false);
    }
  }

  function handleDialogFavoriteChange(input: { isFavorite: boolean; favoriteCount: number }) {
    setSelectedThemeDetail((currentDetail) =>
      currentDetail
        ? {
            ...currentDetail,
            isFavorite: input.isFavorite,
          }
        : currentDetail,
    );
    setItems((currentItems) =>
      currentItems.map((item) =>
        selectedThemeDetail && item.themeId === selectedThemeDetail.themeId
          ? {
              ...item,
              favoriteCount: input.favoriteCount,
              isFavorite: input.isFavorite,
            }
          : item,
      ),
    );
  }

  if (isLoading) {
    return (
      <>
        <ProfileTopHeader />
        <main className={styles.pageShell}>
          <section className={styles.introSection} aria-labelledby="favorite-themes-title">
            <h1 id="favorite-themes-title">찜한 테마</h1>
            <p>흥미로운 테마를 모아보세요.</p>
          </section>
          <p className={styles.stateText}>찜한 테마 목록을 불러오는 중입니다.</p>
        </main>
      </>
    );
  }

  const showEmptyState = !errorMessage && items.length === 0;

  return (
    <>
      <ProfileTopHeader />
      <main className={styles.pageShell}>
        <section className={styles.introSection} aria-labelledby="favorite-themes-title">
          <h1 id="favorite-themes-title">찜한 테마</h1>
          <p>흥미로운 테마를 모아보세요.</p>
        </section>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
        {themeDetailErrorMessage ? <p className={styles.errorMessage}>{themeDetailErrorMessage}</p> : null}
        {isThemeDetailLoading ? <p className={styles.stateText}>테마 상세 정보를 불러오는 중입니다.</p> : null}

        {showEmptyState ? (
          <section className={styles.emptyState}>
            <p>아직 찜한 테마가 없어요</p>
            <Link href="/explore">테마 둘러보기</Link>
          </section>
        ) : null}

        {items.length > 0 ? (
          <>
            <p className={styles.totalCount}>총 {items.length.toLocaleString()}개</p>
            <ul className={styles.favoriteList} aria-label="찜한 테마 목록">
              {items.map((item) => (
                <ProfileFavoriteThemeListItem
                  key={item.themeId}
                  item={item}
                  imageFailed={failedImageIds.includes(item.themeId)}
                  onImageError={handleImageError}
                  onOpenTheme={handleOpenThemeDetail}
                />
              ))}
            </ul>

            {hasNext ? (
              <div className={styles.moreAction}>
                <button type="button" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
                </button>
              </div>
            ) : (
              <p className={styles.endMessage}>여기까지 모두 확인했어요.</p>
            )}
          </>
        ) : null}

        {!items.length && errorMessage ? (
          <div>
            <button
              className={styles.retryButton}
              type="button"
              onClick={() => {
                void loadFirstPage();
              }}
            >
              다시 시도
            </button>
          </div>
        ) : null}
      </main>
      {selectedThemeDetail ? (
        <ExploreThemeDetailDialog
          detail={selectedThemeDetail}
          redirectPath={PROFILE_FAVORITES_PATH}
          onClose={() => setSelectedThemeDetail(null)}
          onFavoriteChange={handleDialogFavoriteChange}
          onOpenRelatedTheme={handleOpenThemeDetail}
        />
      ) : null}
    </>
  );
}
