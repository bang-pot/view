"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getFavoriteThemesSummary } from "@/shared/auth/client";
import type { FavoriteThemesSummaryResponse } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const FAVORITES_ROUTE = "/profile/favorites";

export function ProfileFavoriteThemesSummarySection() {
  const [summary, setSummary] = useState<FavoriteThemesSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImageThemeIds, setFailedImageThemeIds] = useState<number[]>([]);

  useEffect(() => {
    void loadSummary();
  }, []);

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

  function markImageFailed(themeId: number) {
    setFailedImageThemeIds((current) =>
      current.includes(themeId) ? current : [...current, themeId],
    );
  }

  return (
    <section
      aria-label="찜한 테마"
      style={{
        display: "grid",
        gap: 16,
        padding: 20,
        border: "1px solid #d9d9d9",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <h2>찜한 테마</h2>
          <p>최근에 저장한 테마를 프로필 허브에서 바로 다시 확인할 수 있어요.</p>
        </div>
        <Link href={FAVORITES_ROUTE}>전체보기</Link>
      </div>

      {isLoading ? <p>찜한 테마를 불러오는 중입니다.</p> : null}

      {!isLoading && errorMessage ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p>{errorMessage}</p>
          <div>
            <button type="button" onClick={() => void loadSummary()}>
              다시 시도
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading && !errorMessage && summary && summary.items.length === 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p>아직 찜한 테마가 없어요</p>
          <div>
            <Link href="/explore">테마 둘러보기</Link>
          </div>
        </div>
      ) : null}

      {!isLoading && !errorMessage && summary && summary.items.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {summary.items.map((item) => {
            const showFallback =
              !item.thumbnailUrl || failedImageThemeIds.includes(item.themeId);

            return (
              <Link
                key={item.themeId}
                href={`/explore/themes/${item.themeId}`}
                aria-label={item.themeName}
                style={{
                  display: "grid",
                  gap: 12,
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #d9d9d9",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    minHeight: 132,
                    background: "#f5f5f5",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {showFallback ? (
                    <span>테마 이미지 준비 중</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl ?? undefined}
                      alt={`${item.themeName} 썸네일`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={() => markImageFailed(item.themeId)}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gap: 6, padding: "0 16px 16px" }}>
                  <strong>{item.themeName}</strong>
                  <span>{item.storeName}</span>
                  <span>{item.regionName}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
