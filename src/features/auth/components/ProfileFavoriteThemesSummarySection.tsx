"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ExploreThemeDetailDialog } from "@/features/explore/components/ExploreThemeDetailDialog";
import { getFavoriteThemesSummary } from "@/shared/auth/client";
import type { FavoriteThemesSummaryResponse } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { getExploreThemeDetail } from "@/shared/explore/client";
import type { ExploreThemeDetail } from "@/shared/explore/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ProfilePageClient.module.css";

const FAVORITES_ROUTE = "/profile/favorites";

export function ProfileFavoriteThemesSummarySection() {
  const [summary, setSummary] = useState<FavoriteThemesSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageThemeIds, setFailedImageThemeIds] = useState<number[]>([]);
  const [selectedThemeDetail, setSelectedThemeDetail] = useState<ExploreThemeDetail | null>(null);
  const [isThemeDetailLoading, setIsThemeDetailLoading] = useState(false);
  const [themeDetailErrorMessage, setThemeDetailErrorMessage] = useState<string | null>(null);

  async function loadSummary() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getFavoriteThemesSummary();
      setSummary(response);
      setFailedImageThemeIds([]);
    } catch (error) {
      reportOperationalError("auth.profile.favorite_themes_summary_failed", error, {
        route: "/profile",
      });
      setErrorMessage(
        getUserMessage(error, "찜한 테마를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  function markImageFailed(themeId: number) {
    setFailedImageThemeIds((current) =>
      current.includes(themeId) ? current : [...current, themeId],
    );
  }

  async function handleOpenThemeDetail(themeId: number) {
    setThemeDetailErrorMessage(null);
    setIsThemeDetailLoading(true);

    try {
      const response = await getExploreThemeDetail(themeId);

      setSelectedThemeDetail(response);
    } catch (error) {
      reportOperationalError("auth.profile.favorite_theme_detail_failed", error, {
        level: "warn",
        route: "/profile",
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
    setSummary((currentSummary) =>
      currentSummary && selectedThemeDetail
        ? {
            ...currentSummary,
            items: currentSummary.items.map((item) =>
              item.themeId === selectedThemeDetail.themeId
                ? {
                    ...item,
                    favoriteCount: input.favoriteCount,
                    isFavorite: input.isFavorite,
                  }
                : item,
            ),
          }
        : currentSummary,
    );
  }

  return (
    <section className={styles.panelCard} aria-label="찜한 테마">
      <div className={styles.sectionHeader}>
        <h2>찜한 테마</h2>
        <Link href={FAVORITES_ROUTE} aria-label="찜한 테마 전체보기" className={styles.viewAllLink}>
          전체보기 ▪
        </Link>
      </div>

      {isLoading ? <p className={styles.stateText}>찜한 테마를 불러오는 중입니다.</p> : null}
      {isThemeDetailLoading ? <p className={styles.stateText}>테마 상세 정보를 불러오는 중입니다.</p> : null}
      {themeDetailErrorMessage ? <p className={styles.errorText}>{themeDetailErrorMessage}</p> : null}

      {!isLoading && errorMessage ? (
        <div className={styles.emptyState}>
          <p>{errorMessage}</p>
          <button type="button" className={styles.secondaryButton} onClick={() => void loadSummary()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && summary && summary.items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>아직 찜한 테마가 없어요</p>
          <Link href="/explore" className={styles.secondaryButton}>
            테마 둘러보기
          </Link>
        </div>
      ) : null}

      {!isLoading && !errorMessage && summary && summary.items.length > 0 ? (
        <div className={styles.favoriteScroller}>
          {summary.items.map((item) => {
            const showFallback = !item.thumbnailUrl || failedImageThemeIds.includes(item.themeId);

            return (
              <Link
                key={item.themeId}
                href={`/explore/themes/${item.themeId}`}
                aria-label={item.themeName}
                className={styles.favoriteCard}
                onClick={(event) => {
                  event.preventDefault();
                  void handleOpenThemeDetail(item.themeId);
                }}
              >
                {showFallback ? (
                  <span>{item.themeName} 이미지 준비 중</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl ?? ""}
                    alt={`${item.themeName} 썸네일`}
                    onError={() => markImageFailed(item.themeId)}
                  />
                )}
              </Link>
            );
          })}
        </div>
      ) : null}
      {selectedThemeDetail ? (
        <ExploreThemeDetailDialog
          detail={selectedThemeDetail}
          redirectPath="/profile"
          onClose={() => setSelectedThemeDetail(null)}
          onFavoriteChange={handleDialogFavoriteChange}
          onOpenRelatedTheme={handleOpenThemeDetail}
        />
      ) : null}
    </section>
  );
}
