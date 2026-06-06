"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import { getMeetings } from "@/shared/meeting/client";
import type { MeetingListItem } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { MeetingListContent } from "./MeetingListContent";

type MeetingListPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 4;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function mergeMeetings(
  previousItems: MeetingListItem[],
  nextItems: MeetingListItem[],
): MeetingListItem[] {
  const seen = new Set(previousItems.map((item) => item.meetingId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.meetingId)) {
      merged.push(item);
      seen.add(item.meetingId);
    }
  }

  return merged;
}

export function MeetingListPageClient({ crewId }: MeetingListPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);
  const createPath = useMemo(() => `/crews/${crewId}/meetings/new`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void Promise.all([getCrewHub(crewIdNumber), getMeetings(crewIdNumber, { page: 0, size: PAGE_SIZE })])
      .then(([crew, meetingsResponse]) => {
        if (!isMounted) {
          return;
        }

        setCrew(crew);
        setItems(meetingsResponse.items);
        setPage(meetingsResponse.pageInfo.page);
        setHasNext(meetingsResponse.pageInfo.hasNext);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.list_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "모임 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, routePath, router]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const response = await getMeetings(crewIdNumber, {
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeMeetings(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("meeting.list_load_more_failed", error, {
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(error, "모임 목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>모임 목록</h1>
        <p>올바르지 않은 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main>
        <h1>모임 목록</h1>
        <p>{errorMessage}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="meetings" crew={resolvedCrew} crewId={crewId}>
      <MeetingListContent
        crewId={crewId}
        createPath={createPath}
        items={items}
        hasNext={hasNext}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => void handleLoadMore()}
      />
    </CrewWorkspaceShell>
  );
}
