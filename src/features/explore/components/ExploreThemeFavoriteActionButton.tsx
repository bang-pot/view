"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { addThemeFavorite, removeThemeFavorite } from "@/shared/explore/client";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";

import styles from "./ExplorePageClient.module.css";

type FavoriteChange = {
  readonly isFavorite: boolean;
  readonly favoriteCount: number;
};

type ExploreThemeFavoriteActionButtonProps = {
  readonly themeId: number;
  readonly initialIsFavorite: boolean;
  readonly redirectPath: string;
  readonly onChange?: (input: FavoriteChange) => void;
};

function toLoginPath(redirectPath: string): string {
  return `/login?redirectTo=${encodeURIComponent(redirectPath)}`;
}

export function ExploreThemeFavoriteActionButton({
  themeId,
  initialIsFavorite,
  redirectPath,
  onChange,
}: ExploreThemeFavoriteActionButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

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
      setErrorMessage(getUserMessage(error, "찜 상태를 변경하지 못했어요."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonLabel = isFavorite ? "찜 해제" : "찜하기";

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={styles.modalActionButton}
        aria-pressed={isFavorite}
        disabled={isSubmitting}
        onClick={() => void handleClick()}
      >
        {isSubmitting ? "처리 중" : buttonLabel}
      </Button>
      {errorMessage ? (
        <span className={styles.modalActionError} role="status">
          {errorMessage}
        </span>
      ) : null}
    </>
  );
}
