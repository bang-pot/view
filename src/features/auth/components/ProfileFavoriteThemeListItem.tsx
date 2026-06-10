"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import type { FavoriteThemeListItem } from "@/shared/auth/types";

import styles from "./ProfileFavoriteThemeListItem.module.css";

type ProfileFavoriteThemeListItemProps = {
  readonly item: FavoriteThemeListItem;
  readonly imageFailed: boolean;
  readonly onImageError: (themeId: number) => void;
  readonly onOpenTheme?: (themeId: number) => void;
};

function toMetaValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "정보 준비 중";
}

function toRunningTimeLabel(minutes: number | null | undefined): string {
  return minutes === null || minutes === undefined ? "시간 정보 준비 중" : `${minutes}M`;
}

function toDifficultyLabel(difficulty: number | null | undefined): string | null {
  return difficulty === null || difficulty === undefined ? null : `난이도 ${difficulty}`;
}

export function ProfileFavoriteThemeListItem({
  item,
  imageFailed,
  onImageError,
  onOpenTheme,
}: ProfileFavoriteThemeListItemProps) {
  const detailPath = `/explore/themes/${item.themeId}`;
  const imageUrl = imageFailed ? null : item.thumbnailUrl;
  const difficultyLabel = toDifficultyLabel(item.difficulty);

  function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpenTheme) {
      return;
    }

    event.preventDefault();
    onOpenTheme(item.themeId);
  }

  return (
    <li className={styles.item}>
      <Link href={detailPath} className={styles.itemLink} aria-label={`${item.themeName} 상세 보기`} onClick={handleOpen}>
        <div className={styles.posterFrame}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${item.themeName} 썸네일`}
              onError={() => onImageError(item.themeId)}
            />
          ) : (
            <span>테마 이미지 준비 중</span>
          )}
        </div>

        <div className={styles.copy}>
          <div className={styles.titleLine}>
            <strong>{item.themeName}</strong>
            {item.genreName ? <span className={styles.genreBadge}>{item.genreName}</span> : null}
          </div>

          <p className={styles.metaLine}>
            <span aria-hidden="true" className={styles.metaDot} />
            <span>{toRunningTimeLabel(item.runningTimeMinutes)}</span>
            <span aria-hidden="true">·</span>
            <span>{toMetaValue(item.regionName)}</span>
            <span aria-hidden="true">·</span>
            <span>{toMetaValue(item.storeName)}</span>
            {difficultyLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{difficultyLabel}</span>
              </>
            ) : null}
          </p>

          <p className={styles.description}>
            {toMetaValue(item.description)}
          </p>
        </div>

        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}
