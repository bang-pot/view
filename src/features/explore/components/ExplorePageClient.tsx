"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  getExploreFilters,
  getExploreMeetingCreateCrews,
  getExploreThemes,
} from "@/shared/explore/client";
import type {
  ExploreFiltersResponse,
  ExploreMeetingCreateCrew,
  ExploreThemeCard as ExploreThemeCardItem,
  ExploreThemesQuery,
} from "@/shared/explore/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { IconButton } from "@/shared/ui/IconButton";
import { Select } from "@/shared/ui/Select";
import { TextField } from "@/shared/ui/TextField";

import { ThemeFavoriteButton } from "./ThemeFavoriteButton";
import styles from "./ExplorePageClient.module.css";

type ExplorePageClientProps = {
  initialQuery: {
    q: string;
    genres: string[];
    region: string;
    district: string;
  };
};

const PAGE_SIZE = 8;
const FALLBACK_GENRES = ["공포", "추리", "드라마", "로맨스", "코믹", "기타", "음악", "예술", "여행"];

function getDistrictOptions(
  filters: ExploreFiltersResponse | null,
  region: string,
): string[] {
  if (!filters || !region) {
    return [];
  }

  return filters.regions.find((entry) => entry.name === region)?.districts ?? [];
}

function toQueryString(query: {
  q: string;
  genres: string[];
  region: string;
  district: string;
}): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  for (const genre of query.genres) {
    params.append("genres", genre);
  }

  if (query.region) {
    params.set("region", query.region);
  }

  if (query.district) {
    params.set("district", query.district);
  }

  return params.toString();
}

function mergeItems(previousItems: ExploreThemeCardItem[], nextItems: ExploreThemeCardItem[]) {
  const seen = new Set(previousItems.map((item) => item.themeId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.themeId)) {
      merged.push(item);
      seen.add(item.themeId);
    }
  }

  return merged;
}

function buildMeetingCreatePath(crewId: number, theme: ExploreThemeCardItem): string {
  const params = new URLSearchParams();

  params.set("themeName", theme.themeName);
  params.set("storeName", theme.storeName);
  params.set("regionLabel", theme.regionLabel);

  if (theme.genre) {
    params.set("genre", theme.genre);
  }

  if (theme.difficulty !== null) {
    params.set("difficulty", String(theme.difficulty));
  }

  if (theme.runningTimeMinutes !== null) {
    params.set("runningTimeMinutes", String(theme.runningTimeMinutes));
  }

  return `/crews/${crewId}/meetings/new?${params.toString()}`;
}

function SearchIcon() {
  return <span className={styles.searchIcon} aria-hidden="true" />;
}

function SquareIcon() {
  return <span className={styles.squareIcon} aria-hidden="true" />;
}

function ExploreHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="Banglog 홈" className={styles.logoLink}>
          <BrandLogo className={styles.logo} />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/">홈</Link>
          <Link href="/crews/public">크루 탐색</Link>
          <Link href="/explore" aria-current="page">
            방탈출 탐색
          </Link>
        </nav>
        <div className={styles.headerActions} aria-label="사용자 메뉴">
          <span className={styles.notification} aria-hidden="true" />
          <Link href="/profile" className={styles.avatarLink} aria-label="마이페이지">
            A
          </Link>
        </div>
      </div>
    </header>
  );
}

function ThemeCard({
  item,
  onOpen,
  redirectPath,
}: {
  item: ExploreThemeCardItem;
  onOpen: (theme: ExploreThemeCardItem) => void;
  redirectPath: string;
}) {
  const timeLabel =
    item.runningTimeMinutes === null || item.runningTimeMinutes === undefined
      ? "시간 준비 중"
      : `${item.runningTimeMinutes}분`;
  const regionLabel = item.regionLabel || item.storeName;

  return (
    <article className={styles.themeCard}>
      <div className={styles.posterWrap}>
        <ThemeFavoriteButton
          themeId={item.themeId}
          initialIsFavorite={item.isFavorite}
          initialFavoriteCount={item.favoriteCount}
          redirectPath={redirectPath}
          variant="compact"
        />
        <Link
          href={`/explore/themes/${item.themeId}`}
          aria-label={`${item.themeName} 상세 보기`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(item);
          }}
        >
          {item.posterImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.posterImage} src={item.posterImageUrl} alt={`${item.themeName} 포스터`} />
          ) : (
            <div className={styles.posterFallback}>
              <strong>{item.themeName}</strong>
              <span>포스터 준비 중</span>
            </div>
          )}
        </Link>
      </div>
      <div className={styles.themeInfo}>
        <div className={styles.themeTitleRow}>
          <h3>
            <Link
              href={`/explore/themes/${item.themeId}`}
              onClick={(event) => {
                event.preventDefault();
                onOpen(item);
              }}
            >
              {item.themeName}
            </Link>
          </h3>
          {item.genre ? (
            <Chip size="sm" variant="normal" className={styles.genreChip}>
              {item.genre}
            </Chip>
          ) : null}
        </div>
        <p className={styles.themeMeta}>
          <span aria-hidden="true">♥</span>
          {timeLabel}
          <span aria-hidden="true">◆</span>
          {regionLabel}
        </p>
      </div>
    </article>
  );
}

function RelatedThemeCard({
  item,
  onOpen,
  redirectPath,
}: {
  item: ExploreThemeCardItem;
  onOpen: (theme: ExploreThemeCardItem) => void;
  redirectPath: string;
}) {
  return (
    <article className={styles.relatedCard}>
      <div className={styles.relatedPosterWrap}>
        <ThemeFavoriteButton
          themeId={item.themeId}
          initialIsFavorite={item.isFavorite}
          initialFavoriteCount={item.favoriteCount}
          redirectPath={redirectPath}
          variant="compact"
        />
        <Link
          href={`/explore/themes/${item.themeId}`}
          aria-label={`${item.themeName} 상세 보기`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(item);
          }}
        >
          {item.posterImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.relatedPosterImage} src={item.posterImageUrl} alt={`${item.themeName} 포스터`} />
          ) : (
            <div className={styles.relatedPosterFallback} aria-hidden="true">
              {item.themeName}
            </div>
          )}
        </Link>
      </div>
      <div className={styles.relatedInfo}>
        <div className={styles.relatedTitleRow}>
          <h4>
            <Link
              href={`/explore/themes/${item.themeId}`}
              onClick={(event) => {
                event.preventDefault();
                onOpen(item);
              }}
            >
              {item.themeName}
            </Link>
          </h4>
          {item.genre ? (
            <Chip size="sm" variant="normal" className={styles.genreChip}>
              {item.genre}
            </Chip>
          ) : null}
        </div>
        <p>
          <span aria-hidden="true">♡</span>
          {item.favoriteCount.toLocaleString()}
          <span aria-hidden="true">·</span>
          {item.regionLabel || item.storeName}
        </p>
      </div>
    </article>
  );
}

export function ExplorePageClient({ initialQuery }: ExplorePageClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ExploreFiltersResponse | null>(null);
  const [draftQuery, setDraftQuery] = useState(initialQuery.q);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [items, setItems] = useState<ExploreThemeCardItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ExploreThemeCardItem | null>(null);
  const [crews, setCrews] = useState<ExploreMeetingCreateCrew[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");
  const [isCrewPickerOpen, setIsCrewPickerOpen] = useState(false);
  const [isCrewLoading, setIsCrewLoading] = useState(false);
  const [crewPickerErrorMessage, setCrewPickerErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [sortLabel, setSortLabel] = useState("LATEST");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const requestVersionRef = useRef(0);

  const genreOptions = filters?.genres.length ? filters.genres : FALLBACK_GENRES;
  const districtOptions = useMemo(
    () => getDistrictOptions(filters, appliedQuery.region),
    [appliedQuery.region, filters],
  );
  const regionOptions = [
    { label: "선택하세요", value: "" },
    ...(filters?.regions.map((region) => ({
      label: region.name,
      value: region.name,
    })) ?? []),
  ];
  const redirectPath = useMemo(() => {
    const queryString = toQueryString(appliedQuery);
    return queryString ? `/explore?${queryString}` : "/explore";
  }, [appliedQuery]);

  const loadPage = useCallback(async (nextPage: number, mode: "replace" | "append") => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    if (mode === "append") {
      setIsLoadingMore(true);
      setLoadMoreErrorMessage(null);
    } else {
      setIsInitialLoading(true);
      setErrorMessage(null);
      setLoadMoreErrorMessage(null);
      setHasNext(false);
    }

    const query: ExploreThemesQuery = {
      ...appliedQuery,
      page: nextPage,
      size: PAGE_SIZE,
    };

    try {
      const response = await getExploreThemes(query);

      if (!isMountedRef.current || requestVersionRef.current !== requestVersion) {
        return;
      }

      setItems((previousItems) =>
        mode === "append" ? mergeItems(previousItems, response.items) : response.items,
      );
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError(
        mode === "append" ? "explore.themes_load_more_failed" : "explore.themes_load_failed",
        error,
        {
          level: "warn",
          route: "/explore",
        },
      );

      if (!isMountedRef.current || requestVersionRef.current !== requestVersion) {
        return;
      }

      const userMessage = getUserMessage(
        error,
        "방탈출 탐색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      );

      if (mode === "append") {
        setLoadMoreErrorMessage(userMessage);
        return;
      }

      setItems([]);
      setErrorMessage(userMessage);
    } finally {
      if (!isMountedRef.current || requestVersionRef.current !== requestVersion) {
        return;
      }

      if (mode === "append") {
        setIsLoadingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, [appliedQuery]);

  useEffect(() => {
    isMountedRef.current = true;

    void getExploreFilters()
      .then((response) => {
        if (isMountedRef.current) {
          setFilters(response);
        }
      })
      .catch((error) => {
        reportOperationalError("explore.filters_load_failed", error, {
          level: "warn",
          route: "/explore",
        });
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadPage(0, "replace");
  }, [loadPage]);

  useEffect(() => {
    if (!selectedTheme) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTheme(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTheme]);

  useEffect(() => {
    if (!selectedTheme) {
      setIsCrewPickerOpen(false);
      setCrewPickerErrorMessage(null);
      setCrews([]);
      setSelectedCrewId("");
    }
  }, [selectedTheme]);

  function syncUrl(query: typeof appliedQuery) {
    const queryString = toQueryString(query);
    router.replace(queryString ? `/explore?${queryString}` : "/explore");
  }

  function applyQuery(nextQuery: typeof appliedQuery) {
    setAppliedQuery(nextQuery);
    syncUrl(nextQuery);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    applyQuery({
      ...appliedQuery,
      q: draftQuery.trim(),
    });
  }

  function handleGenreToggle(genre: string) {
    const nextGenres = appliedQuery.genres.includes(genre)
      ? appliedQuery.genres.filter((currentGenre) => currentGenre !== genre)
      : [...appliedQuery.genres, genre];

    applyQuery({
      ...appliedQuery,
      genres: nextGenres,
    });
  }

  function handleRegionChange(nextRegion: string) {
    applyQuery({
      ...appliedQuery,
      region: nextRegion,
      district: "",
    });
  }

  async function handleOpenCrewPicker() {
    if (!selectedTheme || isCrewLoading) {
      return;
    }

    setIsCrewLoading(true);
    setCrewPickerErrorMessage(null);

    try {
      const response = await getExploreMeetingCreateCrews();

      setCrews(response.crews);
      setSelectedCrewId(response.crews[0] ? String(response.crews[0].crewId) : "");
      setIsCrewPickerOpen(true);
    } catch (error) {
      reportOperationalError("explore.meeting_create_crews_load_failed", error, {
        level: "warn",
        route: "/explore",
      });

      if (isOperationalError(error) && error.code === "AUTH_UNAUTHENTICATED") {
        router.push("/login?redirectTo=%2Fexplore");
        return;
      }

      setCrews([]);
      setSelectedCrewId("");
      setCrewPickerErrorMessage(
        getUserMessage(error, "크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
      setIsCrewPickerOpen(true);
    } finally {
      setIsCrewLoading(false);
    }
  }

  function handleCreateMeetingFromTheme() {
    if (!selectedTheme || !selectedCrew) {
      return;
    }

    router.push(buildMeetingCreatePath(selectedCrew.crewId, selectedTheme));
  }

  const hasActiveFilters =
    appliedQuery.genres.length > 0 || Boolean(appliedQuery.region) || Boolean(appliedQuery.district);
  const shouldShowEmptyState = !isInitialLoading && !errorMessage && items.length === 0;
  const relatedThemes = selectedTheme
    ? items
        .filter((item) => item.themeId !== selectedTheme.themeId && item.storeId === selectedTheme.storeId)
        .concat(items.filter((item) => item.themeId !== selectedTheme.themeId && item.storeId !== selectedTheme.storeId))
        .slice(0, 4)
    : [];
  const selectedCrew = crews.find((crew) => String(crew.crewId) === selectedCrewId) ?? null;

  return (
    <div className={styles.page}>
      <ExploreHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <form className={styles.heroCopy} onSubmit={handleSearchSubmit}>
              <h1>방탈출 탐색</h1>
              <p>우리 크루원들과 함께 할 방탈출 찾아보기</p>
              <TextField
                label="방탈출 검색"
                type="search"
                value={draftQuery}
                placeholder="테마명, 매장명 검색"
                className={styles.searchField}
                trailingIcon={<SearchIcon />}
                onChange={(event) => setDraftQuery(event.target.value)}
              />
            </form>
            <div className={styles.heroCircle} aria-hidden="true" />
          </div>
        </section>

        <section className={styles.contentSection} aria-labelledby="explore-list-heading">
          <aside className={styles.filterPanel} aria-label="탐색 필터">
            <div>
              <h2>필터</h2>
              <p>적용된 필터</p>
              <div className={styles.appliedFilters}>
                {hasActiveFilters ? (
                  <>
                    {appliedQuery.genres.map((genre) => (
                      <Chip key={genre} size="sm" variant="normal" leftIcon={<SquareIcon />}>
                        {genre}
                      </Chip>
                    ))}
                    {appliedQuery.region ? (
                      <Chip size="sm" variant="normal" leftIcon={<SquareIcon />}>
                        {appliedQuery.region}
                      </Chip>
                    ) : null}
                    {appliedQuery.district ? (
                      <Chip size="sm" variant="normal" leftIcon={<SquareIcon />}>
                        {appliedQuery.district}
                      </Chip>
                    ) : null}
                  </>
                ) : (
                  <span className={styles.noFilterText}>없음</span>
                )}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>장르</h3>
              <div className={styles.genreGrid}>
                {genreOptions.map((genre) => {
                  const selected = appliedQuery.genres.includes(genre);

                  return (
                    <button
                      key={genre}
                      type="button"
                      className={styles.genreButton}
                      data-selected={selected}
                      aria-pressed={selected}
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>지역</h3>
              <Select
                label="지역 선택"
                value={appliedQuery.region}
                options={regionOptions}
                className={styles.regionSelect}
                onChange={(event) => handleRegionChange(event.target.value)}
              />
              {districtOptions.length > 0 ? (
                <div className={styles.districtList} aria-label="세부 지역">
                  {districtOptions.map((district) => {
                    const selected = appliedQuery.district === district;

                    return (
                      <button
                        key={district}
                        type="button"
                        className={styles.districtButton}
                        data-selected={selected}
                        aria-pressed={selected}
                        onClick={() =>
                          applyQuery({
                            ...appliedQuery,
                            district: selected ? "" : district,
                          })
                        }
                      >
                        {district}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </aside>

          <div className={styles.resultArea}>
            <div className={styles.resultHeader}>
              <h2 id="explore-list-heading">방탈출 ({items.length.toLocaleString()})</h2>
              <label className={styles.sortLabel}>
                <span className={styles.visuallyHidden}>정렬</span>
                <select value={sortLabel} onChange={(event) => setSortLabel(event.target.value)}>
                  <option value="LATEST">최신순</option>
                  <option value="POPULAR">인기순</option>
                </select>
              </label>
            </div>

            {isInitialLoading ? (
              <p className={styles.stateText}>방탈출 탐색 결과를 불러오는 중입니다.</p>
            ) : null}
            {errorMessage ? (
              <div className={styles.stateBox}>
                <p>{errorMessage}</p>
                <Button type="button" variant="ghost" onClick={() => void loadPage(0, "replace")}>
                  다시 시도
                </Button>
              </div>
            ) : null}
            {shouldShowEmptyState ? (
              <p className={styles.stateText}>검색 조건에 맞는 방탈출이 없어요.</p>
            ) : null}

            {!errorMessage && items.length > 0 ? (
              <ul className={styles.themeGrid} aria-label="방탈출 탐색 결과 목록">
                {items.map((item) => (
                  <li key={item.themeId}>
                    <ThemeCard item={item} onOpen={setSelectedTheme} redirectPath={redirectPath} />
                  </li>
                ))}
              </ul>
            ) : null}

            {loadMoreErrorMessage ? <p className={styles.stateText}>{loadMoreErrorMessage}</p> : null}
            {isLoadingMore ? <p className={styles.stateText}>다음 방탈출을 불러오는 중입니다.</p> : null}
            {hasNext ? (
              <Button
                type="button"
                variant="ghost"
                className={styles.moreButton}
                disabled={isLoadingMore}
                onClick={() => void loadPage(page + 1, "append")}
              >
                더 보기
              </Button>
            ) : null}
          </div>
        </section>
      </main>
      {selectedTheme ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setSelectedTheme(null)}
        >
          <section
            aria-labelledby="theme-detail-modal-title"
            aria-modal="true"
            className={styles.detailModal}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <IconButton
              type="button"
              size="md"
              variant="background"
              className={styles.modalCloseButton}
              aria-label="닫기"
              onClick={() => setSelectedTheme(null)}
            >
              ×
            </IconButton>
            <div className={styles.modalScrollArea}>
              <div className={styles.modalHero}>
                {selectedTheme.posterImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.modalHeroImage}
                    src={selectedTheme.posterImageUrl}
                    alt={`${selectedTheme.themeName} 포스터`}
                  />
                ) : (
                  <div className={styles.modalHeroFallback} aria-hidden="true" />
                )}
              </div>
              <div className={styles.modalContent}>
                <div className={styles.modalTitleRow}>
                  <h2 id="theme-detail-modal-title">{selectedTheme.themeName}</h2>
                  <div className={styles.modalActions}>
                    <Button type="button" variant="secondary" size="sm" className={styles.modalActionButton}>
                      찜하기
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className={styles.modalActionButton}>
                      홈페이지 이동
                    </Button>
                  </div>
                </div>

                <div className={styles.themeMetaGrid}>
                  <div className={styles.themeMetaItem}>
                    <span className={styles.themeMetaIcon} aria-hidden="true" />
                    <span>테마 장르</span>
                    <strong>{selectedTheme.genre ?? "정보 준비 중"}</strong>
                  </div>
                  <div className={styles.themeMetaItem}>
                    <span className={styles.themeMetaIcon} aria-hidden="true" />
                    <span>인원</span>
                    <strong>{selectedTheme.recommendedPlayers ?? "정보 준비 중"}</strong>
                  </div>
                  <div className={styles.themeMetaItem}>
                    <span className={styles.themeMetaIcon} aria-hidden="true" />
                    <span>소요시간</span>
                    <strong>
                      {selectedTheme.runningTimeMinutes
                        ? `${selectedTheme.runningTimeMinutes}분`
                        : "정보 준비 중"}
                    </strong>
                  </div>
                </div>

                <section className={styles.themeIntroBox}>
                  <h3>테마 소개</h3>
                  <p>
                    {selectedTheme.themeName}은 몰입감 있는 장면과 단서를 따라가며 이야기를
                    풀어가는 방탈출 테마입니다. 자세한 소개와 난이도 정보는 곧 연결될
                    상세 데이터로 채워질 예정입니다.
                  </p>
                  <button type="button">더보기 &gt;</button>
                </section>

                <section className={styles.relatedSection} aria-labelledby="related-themes-heading">
                  <div className={styles.relatedHeader}>
                    <h3 id="related-themes-heading">같은 매장의 다른 테마</h3>
                    <span>{selectedTheme.storeName}</span>
                  </div>
                  {relatedThemes.length > 0 ? (
                    <ul className={styles.relatedList}>
                      {relatedThemes.map((item) => (
                        <li key={item.themeId}>
                          <RelatedThemeCard
                            item={item}
                            onOpen={setSelectedTheme}
                            redirectPath={redirectPath}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.relatedEmptyText}>같은 매장의 다른 테마를 준비 중입니다.</p>
                  )}
                </section>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="primary"
                className={styles.createMeetingButton}
                disabled={isCrewLoading}
                onClick={() => void handleOpenCrewPicker()}
              >
                {isCrewLoading ? "크루 목록 불러오는 중" : "이 테마로 모임 만들기"}
              </Button>
            </div>
          </section>
          {isCrewPickerOpen ? (
            <div
              className={styles.crewPickerBackdrop}
              role="presentation"
              onClick={(event) => {
                event.stopPropagation();
                setIsCrewPickerOpen(false);
              }}
            >
              <section
                aria-label="모임을 만들 크루를 선택해보세요!"
                aria-modal="true"
                className={styles.crewPickerModal}
                role="dialog"
                onClick={(event) => event.stopPropagation()}
              >
                <IconButton
                  type="button"
                  size="sm"
                  variant="background"
                  className={styles.crewPickerCloseButton}
                  aria-label="닫기"
                  onClick={() => setIsCrewPickerOpen(false)}
                >
                  ×
                </IconButton>
                <h2 id="crew-picker-modal-title">
                  모임을 만들 크루를
                  <br />
                  선택해보세요!
                </h2>
                <div className={styles.crewPickerBody}>
                  <h3>내 크루 목록</h3>
                  {crewPickerErrorMessage ? (
                    <p className={styles.crewPickerMessage}>{crewPickerErrorMessage}</p>
                  ) : null}
                  {!crewPickerErrorMessage && crews.length === 0 ? (
                    <p className={styles.crewPickerMessage}>
                      먼저 크루를 만들거나 가입한 뒤 모임을 만들 수 있어요.
                    </p>
                  ) : null}
                  {crews.length > 0 ? (
                    <div className={styles.crewOptionList}>
                      {crews.map((crew) => {
                        const selected = selectedCrewId === String(crew.crewId);

                        return (
                          <button
                            key={crew.crewId}
                            type="button"
                            className={styles.crewOption}
                            aria-pressed={selected}
                            data-selected={selected}
                            onClick={() => setSelectedCrewId(String(crew.crewId))}
                          >
                            {crew.crewName}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.crewPickerSubmitButton}
                  disabled={!selectedCrew}
                  onClick={handleCreateMeetingFromTheme}
                >
                  이 크루에서 모임 만들기
                </Button>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
