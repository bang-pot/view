"use client";

import Link from "next/link";

import { ThemeFavoriteButton } from "@/features/explore/components/ThemeFavoriteButton";
import type { FavoriteThemeListItem } from "@/shared/auth/types";

import styles from "./ProfileFavoriteThemeCard.module.css";

type ProfileFavoriteThemeCardProps = {
  readonly item: FavoriteThemeListItem;
  readonly imageFailed: boolean;
  readonly redirectPath: string;
  readonly onImageError: (themeId: number) => void;
  readonly onFavoriteChange: (input: { themeId: number; isFavorite: boolean }) => void;
};

export function ProfileFavoriteThemeCard({
  item,
  imageFailed,
  redirectPath,
  onImageError,
  onFavoriteChange,
}: ProfileFavoriteThemeCardProps) {
  const detailPath = `/explore/themes/${item.themeId}`;
  const imageUrl = imageFailed ? null : item.thumbnailUrl;

  return (
    <li className={styles.card}>
      <Link className={styles.cardLink} href={detailPath}>
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
        <div className={styles.cardCopy}>
          <span className={styles.titleLine}>
            <strong>{item.themeName}</strong>
            <span className={styles.favoritePill}>찜 {item.favoriteCount.toLocaleString()}</span>
          </span>
          <span className={styles.metaLine}>
            <span aria-hidden="true" className={styles.metaDot} />
            <span>{item.regionName}</span>
            <span aria-hidden="true" className={styles.metaSeparator}>
              ·
            </span>
            <span>{item.storeName}</span>
          </span>
        </div>
      </Link>
      <ThemeFavoriteButton
        themeId={item.themeId}
        initialIsFavorite={item.isFavorite}
        initialFavoriteCount={item.favoriteCount}
        redirectPath={redirectPath}
        variant="compact"
        onChange={(nextState) =>
          onFavoriteChange({
            themeId: item.themeId,
            isFavorite: nextState.isFavorite,
          })
        }
      />
    </li>
  );
}
