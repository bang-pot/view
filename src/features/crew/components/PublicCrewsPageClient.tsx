"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { getExploreCrews } from "@/shared/crew/client";
import {
  EXPLORE_CREW_SORT_LABELS,
  type ExploreCrewCard,
  type ExploreCrewSort,
} from "@/shared/crew/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const CREW_EXPLORE_PATH = "/crews/public";
const PAGE_SIZE = 20;
const SORT_OPTIONS = Object.entries(EXPLORE_CREW_SORT_LABELS) as Array<
  [ExploreCrewSort, string]
>;

function mergeCrews(current: ExploreCrewCard[], next: ExploreCrewCard[]): ExploreCrewCard[] {
  const crewsById = new Map<number, ExploreCrewCard>();

  for (const crew of current) {
    crewsById.set(crew.crewId, crew);
  }

  for (const crew of next) {
    crewsById.set(crew.crewId, crew);
  }

  return Array.from(crewsById.values());
}

function getVisibilityLabel(visibility: ExploreCrewCard["visibility"]): string {
  return visibility === "PUBLIC" ? "공개" : "비공개";
}

function buildQuery(keyword: string, sort: ExploreCrewSort, page: number) {
  const trimmedKeyword = keyword.trim();

  return {
    page,
    size: PAGE_SIZE,
    ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
    sort,
  };
}

export function PublicCrewsPageClient() {
  const [crews, setCrews] = useState<ExploreCrewCard[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ExploreCrewSort>("LATEST");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async (nextPage: number, mode: "replace" | "append") => {
    const requestId = ++requestIdRef.current;

    if (mode === "append") {
      setIsLoadingMore(true);
      setLoadMoreErrorMessage(null);
    } else {
      setIsInitialLoading(true);
      setErrorMessage(null);
      setLoadMoreErrorMessage(null);
      setHasNext(false);
    }

    try {
      const response = await getExploreCrews(buildQuery(keyword, sort, nextPage));

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setCrews((current) =>
        mode === "append" ? mergeCrews(current, response.items) : response.items,
      );
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("crew.explore.list_failed", error, {
        route: CREW_EXPLORE_PATH,
      });

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      const userMessage = getUserMessage(
        error,
        "크루 탐색 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );

      if (mode === "append") {
        setLoadMoreErrorMessage(userMessage);
        return;
      }

      setErrorMessage(userMessage);
      setCrews([]);
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      if (mode === "append") {
        setIsLoadingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, [keyword, sort]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadPage(0, "replace");

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNext || isInitialLoading || isLoadingMore || errorMessage) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadPage(page + 1, "append");
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [errorMessage, hasNext, isInitialLoading, isLoadingMore, loadPage, page]);

  const hasKeyword = keyword.trim().length > 0;
  const shouldShowEmptyState = !errorMessage && !isInitialLoading && crews.length === 0;

  return (
    <main>
      <h1>크루 탐색</h1>
      <p>함께 방탈출을 즐길 크루를 찾아보세요.</p>

      <div>
        <label>
          크루 검색
          <input
            type="search"
            value={keyword}
            placeholder="크루명 또는 크루장 닉네임"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <label>
          정렬
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ExploreCrewSort)}
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isInitialLoading ? <p>크루 탐색 목록을 불러오고 있습니다.</p> : null}
      {errorMessage ? (
        <div>
          <p>{errorMessage}</p>
          <button type="button" onClick={() => void loadPage(0, "replace")}>
            다시 시도
          </button>
        </div>
      ) : null}
      {shouldShowEmptyState ? (
        <p>{hasKeyword ? "검색 결과 없음" : "아직 표시할 크루가 없습니다."}</p>
      ) : null}

      {crews.length > 0 ? (
        <ul>
          {crews.map((crew) => (
            <li key={crew.crewId}>
              <article>
                {crew.imageUrl ? (
                  <Image
                    src={crew.imageUrl}
                    alt={`${crew.name} 대표 이미지`}
                    width={320}
                    height={180}
                  />
                ) : (
                  <div aria-label="대표 이미지 없음" />
                )}
                <h2>
                  <Link href={`/crews/public/${crew.crewId}`}>{crew.name}</Link>
                </h2>
                <p>{crew.description ?? "소개가 아직 없습니다."}</p>
                <p>{getVisibilityLabel(crew.visibility)}</p>
                <p>크루장 {crew.leaderNickname}</p>
                <p>멤버 {crew.memberCount}명</p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      {loadMoreErrorMessage ? <p>{loadMoreErrorMessage}</p> : null}
      {isLoadingMore ? <p>크루를 더 불러오고 있습니다.</p> : null}
      <div ref={sentinelRef} aria-hidden="true" />
    </main>
  );
}
