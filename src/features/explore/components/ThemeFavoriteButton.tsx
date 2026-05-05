"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { addThemeFavorite, removeThemeFavorite } from "@/shared/explore/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ThemeFavoriteButton.module.css";

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

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
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
      setErrorMessage(getUserMessage(error, "찜 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const countLabel = favoriteCount === null ? "0" : favoriteCount.toLocaleString();
  const buttonLabel = isFavorite ? "찜 해제" : "찜하기";

  return (
    <div className={cx(styles.root, variant === "compact" && styles.compact)}>
      <button
        type="button"
        aria-label={buttonLabel}
        aria-pressed={isFavorite}
        className={styles.button}
        disabled={isSubmitting}
        onClick={handleClick}
      >
        <span aria-hidden="true">♡</span>
        <span>{variant === "compact" ? countLabel : buttonLabel}</span>
      </button>
      {variant === "compact" ? null : (
        <span className={styles.count} aria-label="찜 수">
          {countLabel}
        </span>
      )}
      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
    </div>
  );
}
