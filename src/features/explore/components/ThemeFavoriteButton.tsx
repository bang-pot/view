"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { addThemeFavorite, removeThemeFavorite } from "@/shared/explore/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

type ThemeFavoriteButtonProps = {
  themeId: number;
  initialIsFavorite: boolean;
  initialFavoriteCount?: number | null;
  redirectPath: string;
  variant?: "compact" | "default";
  onChange?: (input: { isFavorite: boolean; favoriteCount: number }) => void;
};

function toLoginPath(redirectPath: string): string {
  return `/login?redirectTo=${encodeURIComponent(redirectPath)}`;
}

export function ThemeFavoriteButton({
  themeId,
  initialIsFavorite,
  initialFavoriteCount = null,
  redirectPath,
  variant = "default",
  onChange,
}: ThemeFavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  useEffect(() => {
    setFavoriteCount(initialFavoriteCount);
  }, [initialFavoriteCount]);

  async function handleClick() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = isFavorite
        ? await removeThemeFavorite(themeId)
        : await addThemeFavorite(themeId);

      setIsFavorite(response.isFavorite);
      setFavoriteCount(response.favoriteCount);
      onChange?.({
        isFavorite: response.isFavorite,
        favoriteCount: response.favoriteCount,
      });
    } catch (error) {
      if (isOperationalError(error) && error.code === "AUTH_UNAUTHENTICATED") {
        router.push(toLoginPath(redirectPath));
        return;
      }

      reportOperationalError("explore.theme_favorite.toggle_failed", error, {
        level: "warn",
        route: redirectPath,
      });
      setErrorMessage(
        getUserMessage(error, "찜 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const compact = variant === "compact";

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        justifyItems: compact ? "end" : "start",
      }}
    >
      <button
        type="button"
        aria-pressed={isFavorite}
        onClick={handleClick}
        disabled={isSubmitting}
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 999,
          padding: compact ? "6px 10px" : "8px 14px",
          background: isFavorite ? "#111" : "#fff",
          color: isFavorite ? "#fff" : "#111",
          opacity: isSubmitting ? 0.6 : 1,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          fontSize: compact ? 12 : 14,
        }}
      >
        {isSubmitting ? "처리 중..." : isFavorite ? "찜 해제" : "찜하기"}
      </button>
      {favoriteCount !== null ? (
        <span aria-label="찜 수" style={{ fontSize: 12, color: "#666" }}>
          {favoriteCount}
        </span>
      ) : null}
      {errorMessage ? <p style={{ margin: 0 }}>{errorMessage}</p> : null}
    </div>
  );
}
