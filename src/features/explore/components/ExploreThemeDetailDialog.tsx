"use client";

import Link from "next/link";

import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { IconButton } from "@/shared/ui/IconButton";
import type { ExploreRelatedThemeCard, ExploreThemeDetail } from "@/shared/explore/types";

import { ExploreThemeFavoriteActionButton } from "./ExploreThemeFavoriteActionButton";
import styles from "./ExplorePageClient.module.css";

type ExploreThemeDetailDialogProps = {
  readonly detail: ExploreThemeDetail;
  readonly redirectPath: string;
  readonly onClose: () => void;
  readonly onFavoriteChange?: (input: { isFavorite: boolean; favoriteCount: number }) => void;
  readonly onOpenRelatedTheme?: (themeId: number) => void;
};

function formatGenres(genres: readonly string[]): string {
  return genres.length > 0 ? genres.join(", ") : "정보 준비 중";
}

function getPrimaryGenre(genres: readonly string[]): string | null {
  return genres[0] ?? null;
}

function getRunningTimeLabel(minutes: number | null): string {
  return minutes === null ? "정보 준비 중" : `${minutes}분`;
}

function RelatedThemeDialogCard({
  item,
  onOpen,
}: {
  readonly item: ExploreRelatedThemeCard;
  readonly onOpen?: (themeId: number) => void;
}) {
  const primaryGenre = getPrimaryGenre(item.genres);

  return (
    <article className={styles.relatedCard}>
      <div className={styles.relatedPosterWrap}>
        <Link
          href={`/explore/themes/${item.themeId}`}
          aria-label={`${item.themeName} 상세 보기`}
          onClick={(event) => {
            if (!onOpen) {
              return;
            }

            event.preventDefault();
            onOpen(item.themeId);
          }}
        >
          {item.posterImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.relatedPosterImage} src={item.posterImageUrl} alt={`${item.themeName} 포스터`} />
          ) : (
            <div className={styles.relatedPosterFallback} aria-hidden="true">
              {item.themeName}
            </div>
          )}
        </Link>
      </div>
      <div className={styles.relatedInfo}>
        <div className={styles.relatedTitleRow}>
          <h4>
            <Link
              href={`/explore/themes/${item.themeId}`}
              onClick={(event) => {
                if (!onOpen) {
                  return;
                }

                event.preventDefault();
                onOpen(item.themeId);
              }}
            >
              {item.themeName}
            </Link>
          </h4>
          {primaryGenre ? (
            <Chip size="sm" variant="normal" className={styles.genreChip}>
              {primaryGenre}
            </Chip>
          ) : null}
        </div>
        <p>
          <span className={styles.themeMetaItem} aria-label={`찜 ${item.favoriteCount.toLocaleString()}`}>
            <span className={styles.metaHeartIcon} aria-hidden="true" />
            {item.favoriteCount.toLocaleString()}
          </span>
          <span className={styles.themeMetaItem} aria-label={`매장 ${item.storeName}`}>
            <span className={styles.metaStoreIcon} aria-hidden="true" />
            {item.storeName || "매장 정보 준비 중"}
          </span>
        </p>
      </div>
    </article>
  );
}

export function ExploreThemeDetailDialog({
  detail,
  redirectPath,
  onClose,
  onFavoriteChange,
  onOpenRelatedTheme,
}: ExploreThemeDetailDialogProps) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        aria-labelledby="theme-detail-modal-title"
        aria-modal="true"
        className={styles.detailModal}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton
          type="button"
          size="md"
          variant="background"
          className={styles.modalCloseButton}
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </IconButton>
        <div className={styles.modalScrollArea}>
          <div className={styles.modalHero}>
            {detail.posterImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.modalHeroImage} src={detail.posterImageUrl} alt={`${detail.themeName} 포스터`} />
            ) : (
              <div className={styles.modalHeroFallback} aria-hidden="true" />
            )}
          </div>
          <div className={styles.modalContent}>
            <div className={styles.modalTitleRow}>
              <h2 id="theme-detail-modal-title">{detail.themeName}</h2>
              <div className={styles.modalActions}>
                <ExploreThemeFavoriteActionButton
                  themeId={detail.themeId}
                  initialIsFavorite={detail.isFavorite}
                  redirectPath={redirectPath}
                  onChange={onFavoriteChange}
                />
                {detail.externalLink ? (
                  <Button
                    href={detail.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    variant="ghost"
                    size="sm"
                    className={styles.modalActionButton}
                  >
                    홈페이지 이동
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={styles.modalActionButton}
                    disabled
                  >
                    홈페이지 이동
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.themeMetaGrid}>
              <div className={styles.themeDetailMetaItem}>
                <span className={styles.themeMetaIcon} aria-hidden="true" />
                <span>테마 장르</span>
                <strong>{formatGenres(detail.genres)}</strong>
              </div>
              <div className={styles.themeDetailMetaItem}>
                <span className={styles.themeMetaIcon} aria-hidden="true" />
                <span>인원</span>
                <strong>정보 준비 중</strong>
              </div>
              <div className={styles.themeDetailMetaItem}>
                <span className={styles.themeMetaIcon} aria-hidden="true" />
                <span>소요시간</span>
                <strong>{getRunningTimeLabel(detail.runningTimeMinutes)}</strong>
              </div>
            </div>

            <section className={styles.themeIntroBox}>
              <h3>테마 소개</h3>
              <p>{detail.description || "등록된 설명이 없습니다."}</p>
            </section>

            <section className={styles.relatedSection} aria-labelledby="related-themes-heading">
              <div className={styles.relatedHeader}>
                <h3 id="related-themes-heading">같은 매장의 다른 테마</h3>
                <span>{detail.storeName}</span>
              </div>
              {detail.relatedThemes.length > 0 ? (
                <ul className={styles.relatedList}>
                  {detail.relatedThemes.map((item) => (
                    <li key={item.themeId}>
                      <RelatedThemeDialogCard item={item} onOpen={onOpenRelatedTheme} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.relatedEmptyText}>같은 매장의 다른 테마를 준비 중입니다.</p>
              )}
            </section>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <Button
            href={`/explore/themes/${detail.themeId}`}
            variant="primary"
            className={styles.createMeetingButton}
          >
            이 테마로 모임 만들기
          </Button>
        </div>
      </section>
    </div>
  );
}
