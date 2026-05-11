"use client";

import Link from "next/link";

import { ThemeFavoriteButton } from "./ThemeFavoriteButton";

export type ExploreThemeCardViewModel = {
  themeId: number;
  themeName: string;
  storeName: string;
  regionLabel: string;
  posterImageUrl: string | null;
  favoriteCount: number;
  isFavorite: boolean;
  genres?: string[];
  difficulty?: number | null;
  activityLabel?: string | null;
  recommendedPlayers?: string | null;
  runningTimeMinutes?: number | null;
};

type ExploreThemeCardProps = {
  item: ExploreThemeCardViewModel;
  redirectPath?: string;
  variant?: "full" | "preview";
};

function toCardValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "정보 준비 중";
  }

  return String(value);
}

function toGenreValue(genres: string[] | undefined): string {
  return genres && genres.length > 0 ? genres.join(", ") : "정보 준비 중";
}

export function ExploreThemeCard({
  item,
  redirectPath = "/explore",
  variant = "full",
}: ExploreThemeCardProps) {
  const isPreview = variant === "preview";

  return (
    <article
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        opacity: 0.98,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
        <ThemeFavoriteButton
          themeId={item.themeId}
          initialIsFavorite={item.isFavorite}
          initialFavoriteCount={item.favoriteCount}
          redirectPath={redirectPath}
          variant="compact"
        />
      </div>

      <Link
        href={`/explore/themes/${item.themeId}`}
        aria-label={`${item.themeName} 상세 보기`}
        style={{
          color: "inherit",
          textDecoration: "none",
          display: "block",
        }}
      >
        {item.posterImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.posterImageUrl}
            alt={`${item.themeName} 포스터`}
            style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 5",
              display: "grid",
              placeItems: "center",
              background: "#f5f5f5",
              color: "#666",
            }}
          >
            포스터 준비 중
          </div>
        )}

        <div style={{ padding: 16, display: "grid", gap: 8 }}>
          <strong style={{ paddingRight: 88 }}>{item.themeName}</strong>
          <span
            aria-label={`찜 ${item.favoriteCount.toLocaleString()}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <span aria-hidden="true">♡</span>
            <span>{item.favoriteCount.toLocaleString()}</span>
          </span>
          <span>{item.storeName}</span>
          <span>{item.regionLabel}</span>

          {isPreview ? null : <span>{toGenreValue(item.genres)}</span>}
          {isPreview ? null : <span>난이도 {toCardValue(item.difficulty)}</span>}
          {isPreview ? null : <span>활동성 {toCardValue(item.activityLabel)}</span>}
          {isPreview ? null : <span>권장 인원 {toCardValue(item.recommendedPlayers)}</span>}

          <span>
            플레이 시간{" "}
            {item.runningTimeMinutes === null || item.runningTimeMinutes === undefined
              ? "정보 준비 중"
              : `${item.runningTimeMinutes}분`}
          </span>
          <span style={{ color: "#666" }}>상세 보기</span>
        </div>
      </Link>
    </article>
  );
}
