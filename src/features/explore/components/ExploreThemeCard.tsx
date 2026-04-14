"use client";

import Link from "next/link";

import type { ExploreThemeCard as ExploreThemeCardType } from "@/shared/explore/types";

function toCardValue(value: string | number | null): string {
  if (value === null || value === "") {
    return "정보 준비 중";
  }

  return String(value);
}

type ExploreThemeCardProps = {
  item: ExploreThemeCardType;
};

export function ExploreThemeCard({ item }: ExploreThemeCardProps) {
  return (
    <article
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        opacity: 0.98,
      }}
    >
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>{item.themeName}</strong>
            <span aria-label="찜 수">관심 {item.favoriteCount}</span>
          </div>
          <span>{item.storeName}</span>
          <span>{item.regionLabel}</span>
          <span>{toCardValue(item.genre)}</span>
          <span>난이도 {toCardValue(item.difficulty)}</span>
          <span>활동성 {toCardValue(item.activityLabel)}</span>
          <span>권장 인원 {toCardValue(item.recommendedPlayers)}</span>
          <span>
            플레이 시간{" "}
            {item.runningTimeMinutes === null ? "정보 준비 중" : `${item.runningTimeMinutes}분`}
          </span>
          <span style={{ color: "#666" }}>상세 보기</span>
        </div>
      </Link>
    </article>
  );
}
