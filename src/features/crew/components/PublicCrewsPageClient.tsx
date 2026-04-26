"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getUserMessage } from "@/shared/errors/operational";
import { getPublicCrews } from "@/shared/crew/client";
import type { PublicCrewSummary } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PUBLIC_CREWS_PATH = "/crews/public";
const PAGE_SIZE = 20;

function mergeCrews(current: PublicCrewSummary[], next: PublicCrewSummary[]): PublicCrewSummary[] {
  const crewsById = new Map<number, PublicCrewSummary>();

  for (const crew of current) {
    crewsById.set(crew.crewId, crew);
  }

  for (const crew of next) {
    crewsById.set(crew.crewId, crew);
  }

  return Array.from(crewsById.values());
}

export function PublicCrewsPageClient() {
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);

  const loadPage = useCallback(async (nextPage: number, mode: "replace" | "append") => {
    if (mode === "append") {
      setIsLoadingMore(true);
      setLoadMoreErrorMessage(null);
    } else {
      setIsInitialLoading(true);
      setErrorMessage(null);
    }

    try {
      const response = await getPublicCrews({
        page: nextPage,
        size: PAGE_SIZE,
      });

      if (!isMountedRef.current) {
        return;
      }

      setCrews((current) =>
        mode === "append" ? mergeCrews(current, response.items) : response.items,
      );
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("crew.public.list_failed", error, {
        route: PUBLIC_CREWS_PATH,
      });

      if (!isMountedRef.current) {
        return;
      }

      const userMessage = getUserMessage(
        error,
        "공개 크루 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      );

      if (mode === "append") {
        setLoadMoreErrorMessage(userMessage);
        return;
      }

      setErrorMessage(userMessage);
    } finally {
      if (!isMountedRef.current) {
        return;
      }

      if (mode === "append") {
        setIsLoadingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadPage(0, "replace");

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNext || isInitialLoading || isLoadingMore) {
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
  }, [hasNext, isInitialLoading, isLoadingMore, loadPage, page]);

  if (isInitialLoading) {
    return (
      <main>
        <p>공개 크루 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Public crews</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && crews.length === 0 ? <p>아직 공개 크루가 없습니다.</p> : null}
      <ul>
        {crews.map((crew) => (
          <li key={crew.crewId}>
            <article>
              <h2>
                <Link href={`/crews/public/${crew.crewId}`}>{crew.name}</Link>
              </h2>
              <p>{crew.description ?? "소개가 아직 없습니다."}</p>
            </article>
          </li>
        ))}
      </ul>
      {loadMoreErrorMessage ? <p>{loadMoreErrorMessage}</p> : null}
      {isLoadingMore ? <p>공개 크루를 더 불러오고 있습니다.</p> : null}
      <div ref={sentinelRef} aria-hidden="true" />
    </main>
  );
}
