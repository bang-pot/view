"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { getUserMessage } from "@/shared/errors/operational";
import { getExploreFilters, getExploreThemes } from "@/shared/explore/client";
import type {
  ExploreFiltersResponse,
  ExploreThemeCard as ExploreThemeCardItem,
  ExploreThemesQuery,
} from "@/shared/explore/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { ExploreThemeCard } from "./ExploreThemeCard";

type ExplorePageClientProps = {
  initialQuery: {
    q: string;
    genres: string[];
    region: string;
    district: string;
  };
};

const PAGE_SIZE = 20;

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

export function ExplorePageClient({ initialQuery }: ExplorePageClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ExploreFiltersResponse | null>(null);
  const [draftQuery, setDraftQuery] = useState(initialQuery.q);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [items, setItems] = useState<ExploreThemeCardItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryVersionRef = useRef(0);

  const districtOptions = useMemo(
    () => getDistrictOptions(filters, appliedQuery.region),
    [appliedQuery.region, filters],
  );

  useEffect(() => {
    let isMounted = true;

    void getExploreFilters()
      .then((response) => {
        if (isMounted) {
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
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const requestVersion = queryVersionRef.current + 1;
    queryVersionRef.current = requestVersion;

    const query: ExploreThemesQuery = {
      ...appliedQuery,
      page: 0,
      size: PAGE_SIZE,
    };

    void getExploreThemes(query)
      .then((response) => {
        if (!isMounted || queryVersionRef.current !== requestVersion) {
          return;
        }

        setItems(response.items);
        setPage(response.pageInfo.page);
        setHasNext(response.pageInfo.hasNext);
        setIsInitialLoading(false);
      })
      .catch((error) => {
        reportOperationalError("explore.themes_load_failed", error, {
          level: "warn",
          route: "/explore",
        });

        if (!isMounted || queryVersionRef.current !== requestVersion) {
          return;
        }

        setItems([]);
        setHasNext(false);
        setIsInitialLoading(false);
        setErrorMessage(
          getUserMessage(
            error,
            "탐색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
      });

    return () => {
      isMounted = false;
    };
  }, [appliedQuery]);

  useEffect(() => {
    const target = sentinelRef.current;

    if (!target || !hasNext || isInitialLoading || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const firstEntry = entries[0];

      if (!firstEntry?.isIntersecting) {
        return;
      }

      setIsLoadingMore(true);

      void getExploreThemes({
        ...appliedQuery,
        page: page + 1,
        size: PAGE_SIZE,
      })
        .then((response) => {
          setItems((previousItems) => mergeItems(previousItems, response.items));
          setPage(response.pageInfo.page);
          setHasNext(response.pageInfo.hasNext);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          reportOperationalError("explore.themes_load_more_failed", error, {
            level: "warn",
            route: "/explore",
          });
          setIsLoadingMore(false);
        });
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [appliedQuery, hasNext, isInitialLoading, isLoadingMore, page]);

  function syncUrl(query: typeof appliedQuery) {
    const queryString = toQueryString(query);
    router.replace(queryString ? `/explore?${queryString}` : "/explore");
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = {
      ...appliedQuery,
      q: draftQuery.trim(),
    };

    setIsInitialLoading(true);
    setErrorMessage(null);
    setAppliedQuery(nextQuery);
    syncUrl(nextQuery);
  }

  function handleGenreToggle(genre: string, checked: boolean) {
    const nextGenres = checked
      ? [...appliedQuery.genres, genre]
      : appliedQuery.genres.filter((currentGenre) => currentGenre !== genre);

    const nextQuery = {
      ...appliedQuery,
      genres: nextGenres,
    };

    setIsInitialLoading(true);
    setErrorMessage(null);
    setAppliedQuery(nextQuery);
    syncUrl(nextQuery);
  }

  function handleRegionChange(nextRegion: string) {
    const nextQuery = {
      ...appliedQuery,
      region: nextRegion,
      district: "",
    };

    setIsInitialLoading(true);
    setErrorMessage(null);
    setAppliedQuery(nextQuery);
    syncUrl(nextQuery);
  }

  function handleDistrictChange(nextDistrict: string) {
    const nextQuery = {
      ...appliedQuery,
      district: nextDistrict,
    };

    setIsInitialLoading(true);
    setErrorMessage(null);
    setAppliedQuery(nextQuery);
    syncUrl(nextQuery);
  }

  return (
    <main>
      <h1>방탈출 탐색</h1>
      <p>지역, 매장명, 테마명으로 원하는 방탈출을 한 번에 찾아보세요.</p>

      <form
        onSubmit={handleSearchSubmit}
        style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 280 }}>
          <span>통합 검색</span>
          <input
            aria-label="통합 검색"
            type="search"
            value={draftQuery}
            onChange={(event) => {
              setDraftQuery(event.target.value);
            }}
            placeholder="지역, 매장명, 테마명을 검색해 보세요."
            style={{ padding: 12 }}
          />
        </label>
        <button type="submit" style={{ alignSelf: "end", height: 44 }}>
          검색
        </button>
      </form>

      <section
        aria-label="탐색 필터"
        style={{ display: "grid", gap: 16, marginBottom: 24, maxWidth: 960 }}
      >
        <fieldset style={{ border: "1px solid #d9d9d9", padding: 16 }}>
          <legend>장르</legend>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {filters?.genres.map((genre) => (
              <label key={genre} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  aria-label={`장르 ${genre}`}
                  checked={appliedQuery.genres.includes(genre)}
                  onChange={(event) => {
                    handleGenreToggle(genre, event.target.checked);
                  }}
                />
                <span>{genre}</span>
              </label>
            )) ?? <span>필터를 준비 중입니다.</span>}
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
            <span>시/도</span>
            <select
              aria-label="시/도"
              value={appliedQuery.region}
              onChange={(event) => {
                handleRegionChange(event.target.value);
              }}
              style={{ padding: 12 }}
            >
              <option value="">전체</option>
              {filters?.regions.map((region) => (
                <option key={region.name} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
            <span>구/군</span>
            <select
              aria-label="구/군"
              value={appliedQuery.district}
              onChange={(event) => {
                handleDistrictChange(event.target.value);
              }}
              disabled={!appliedQuery.region}
              style={{ padding: 12 }}
            >
              <option value="">전체</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {isInitialLoading ? <p>탐색 결과를 불러오는 중입니다.</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {!isInitialLoading && !errorMessage && items.length === 0 ? (
        <p>검색 조건을 바꿔서 다시 찾아보세요.</p>
      ) : null}

      {!errorMessage ? (
        <ul
          aria-label="탐색 결과 목록"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((item) => (
            <li key={item.themeId}>
              <ExploreThemeCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      {isLoadingMore ? <p>다음 결과를 불러오는 중입니다.</p> : null}
      {!hasNext && items.length > 0 && !isInitialLoading ? <p>여기까지 모두 확인했어요.</p> : null}
    </main>
  );
}
