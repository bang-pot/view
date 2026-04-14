"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getUserMessage } from "@/shared/errors/operational";
import { getExploreThemeDetail } from "@/shared/explore/client";
import type { ExploreThemeDetail } from "@/shared/explore/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { ExploreThemeCard } from "./ExploreThemeCard";

type ExploreThemeDetailPageClientProps = {
  themeId: number;
};

const DESCRIPTION_PREVIEW_LENGTH = 80;

function toDetailValue(value: string | number | null, prefix: string): string {
  if (value === null || value === "") {
    return `${prefix} 정보 준비 중`;
  }

  return `${prefix} ${value}`;
}

function shouldCollapseDescription(description: string | null): boolean {
  if (!description) {
    return false;
  }

  return description.length > DESCRIPTION_PREVIEW_LENGTH;
}

export function ExploreThemeDetailPageClient({
  themeId,
}: ExploreThemeDetailPageClientProps) {
  const [detail, setDetail] = useState<ExploreThemeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getExploreThemeDetail(themeId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setDetail(response);
        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("explore.theme_detail_load_failed", error, {
          level: "warn",
          route: `/explore/themes/${themeId}`,
        });

        if (!isMounted) {
          return;
        }

        setDetail(null);
        setIsLoading(false);
        setErrorMessage(
          getUserMessage(
            error,
            "테마 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
      });

    return () => {
      isMounted = false;
    };
  }, [themeId]);

  const descriptionText = !detail?.description
    ? "등록된 설명이 없습니다."
    : isDescriptionExpanded || !shouldCollapseDescription(detail.description)
      ? detail.description
      : `${detail.description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;

  return (
    <main>
      <p>
        <Link href="/explore">탐색으로 돌아가기</Link>
      </p>

      {isLoading ? <p>테마 정보를 불러오는 중입니다.</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      {!isLoading && !errorMessage && detail ? (
        <>
          <section
            aria-label="테마 상세 정보"
            style={{ display: "grid", gap: 24, marginBottom: 32 }}
          >
            <div style={{ maxWidth: 360 }}>
              {detail.posterImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.posterImageUrl}
                  alt={`${detail.themeName} 포스터`}
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 5",
                    objectFit: "cover",
                    borderRadius: 16,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 5",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 16,
                    background: "#f5f5f5",
                    color: "#666",
                  }}
                >
                  포스터 준비 중
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <h1>{detail.themeName}</h1>
              <div style={{ display: "grid", gap: 8 }}>
                <strong>{detail.storeName}</strong>
                <span>{detail.regionLabel}</span>
                <span>{toDetailValue(detail.genre, "장르")}</span>
                <span>{toDetailValue(detail.difficulty, "난이도")}</span>
                <span>
                  {detail.runningTimeMinutes === null
                    ? "플레이 시간 정보 준비 중"
                    : `플레이 시간 ${detail.runningTimeMinutes}분`}
                </span>
              </div>

              <section aria-label="테마 소개" style={{ display: "grid", gap: 8 }}>
                <h2>테마 소개</h2>
                <p>{descriptionText}</p>
                {detail.description && shouldCollapseDescription(detail.description) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDescriptionExpanded((current) => !current);
                    }}
                    style={{ width: "fit-content" }}
                  >
                    {isDescriptionExpanded ? "접기" : "더보기"}
                  </button>
                ) : null}
              </section>

              {detail.externalLink ? (
                <p>
                  <a
                    href={detail.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="외부 예약 페이지 열기"
                  >
                    외부 예약 페이지 열기
                  </a>
                </p>
              ) : null}
            </div>
          </section>

          <section aria-label="같은 매장의 다른 테마" style={{ display: "grid", gap: 16 }}>
            <h2>같은 매장의 다른 테마</h2>
            {detail.relatedThemes.length > 0 ? (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {detail.relatedThemes.slice(0, 4).map((relatedTheme) => (
                  <li key={relatedTheme.themeId}>
                    <ExploreThemeCard item={relatedTheme} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>같은 매장의 다른 테마가 아직 없어요.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
