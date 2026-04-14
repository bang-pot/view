"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  getExploreMeetingCreateCrews,
  getExploreThemeDetail,
} from "@/shared/explore/client";
import type {
  ExploreMeetingCreateCrew,
  ExploreThemeDetail,
} from "@/shared/explore/types";
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

function buildMeetingCreatePath(
  crewId: number,
  detail: ExploreThemeDetail,
): string {
  const params = new URLSearchParams();

  params.set("themeName", detail.themeName);
  params.set("storeName", detail.storeName);
  params.set("regionLabel", detail.regionLabel);

  if (detail.genre) {
    params.set("genre", detail.genre);
  }

  if (detail.difficulty) {
    params.set("difficulty", detail.difficulty);
  }

  if (detail.runningTimeMinutes !== null) {
    params.set("runningTimeMinutes", String(detail.runningTimeMinutes));
  }

  return `/crews/${crewId}/meetings/new?${params.toString()}`;
}

export function ExploreThemeDetailPageClient({
  themeId,
}: ExploreThemeDetailPageClientProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<ExploreThemeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [crews, setCrews] = useState<ExploreMeetingCreateCrew[]>([]);
  const [isCrewLoading, setIsCrewLoading] = useState(false);
  const [isCrewPickerOpen, setIsCrewPickerOpen] = useState(false);
  const [crewErrorMessage, setCrewErrorMessage] = useState<string | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");

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

  const canStartMeetingCreate = !isLoading && !errorMessage && detail !== null;
  const hasCrews = crews.length > 0;
  const noCrews = isCrewPickerOpen && !isCrewLoading && crews.length === 0 && !crewErrorMessage;
  const selectedCrew = useMemo(
    () => crews.find((crew) => String(crew.crewId) === selectedCrewId) ?? null,
    [crews, selectedCrewId],
  );

  async function handleOpenCrewPicker() {
    if (!detail || isCrewLoading) {
      return;
    }

    setCrewErrorMessage(null);
    setIsCrewLoading(true);

    try {
      const response = await getExploreMeetingCreateCrews();

      setCrews(response.crews);
      setSelectedCrewId(response.crews[0] ? String(response.crews[0].crewId) : "");
      setIsCrewPickerOpen(true);
    } catch (error) {
      reportOperationalError("explore.meeting_create_crews_load_failed", error, {
        level: "warn",
        route: `/explore/themes/${themeId}`,
      });

      if (isOperationalError(error) && error.code === "AUTH_UNAUTHENTICATED") {
        router.push("/login");
        return;
      }

      setCrewErrorMessage(
        getUserMessage(
          error,
          "크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
      setIsCrewPickerOpen(true);
      setCrews([]);
      setSelectedCrewId("");
    } finally {
      setIsCrewLoading(false);
    }
  }

  function handleStartMeetingCreate() {
    if (!detail || !selectedCrew) {
      return;
    }

    router.push(buildMeetingCreatePath(selectedCrew.crewId, detail));
  }

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

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button type="button" onClick={handleOpenCrewPicker} disabled={!canStartMeetingCreate}>
                  이 테마로 모임 만들기
                </button>
                {detail.externalLink ? (
                  <a
                    href={detail.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="외부 예약 페이지 열기"
                  >
                    외부 예약 페이지 열기
                  </a>
                ) : null}
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
            </div>
          </section>

          {isCrewLoading ? <p>크루 목록을 불러오는 중입니다.</p> : null}
          {isCrewPickerOpen ? (
            <section aria-label="모임 만들기 크루 선택" style={{ display: "grid", gap: 12, marginBottom: 32 }}>
              <h2>모임 만들기 크루 선택</h2>
              <p>어느 크루에서 이 테마로 모임을 만들지 먼저 선택해 주세요.</p>
              {crewErrorMessage ? <p>{crewErrorMessage}</p> : null}
              {noCrews ? <p>먼저 크루를 만들거나 가입해야 모임을 만들 수 있어요.</p> : null}
              {hasCrews ? (
                <>
                  <fieldset style={{ display: "grid", gap: 8 }}>
                    <legend>크루 목록</legend>
                    {crews.map((crew) => (
                      <label
                        key={crew.crewId}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <input
                          type="radio"
                          name="meeting-create-crew"
                          value={crew.crewId}
                          checked={selectedCrewId === String(crew.crewId)}
                          onChange={(event) => {
                            setSelectedCrewId(event.target.value);
                          }}
                        />
                        <span>{crew.crewName}</span>
                      </label>
                    ))}
                  </fieldset>
                  <button
                    type="button"
                    onClick={handleStartMeetingCreate}
                    disabled={!selectedCrew}
                    style={{ width: "fit-content" }}
                  >
                    선택한 크루로 모임 만들기
                  </button>
                </>
              ) : null}
            </section>
          ) : null}

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
