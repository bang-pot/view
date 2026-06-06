"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCrewHub, getCrewMembers } from "@/shared/crew/client";
import type { CrewHubResponse, CrewMember } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
  CrewWorkspaceStatePage,
} from "./CrewPageClient";
import { CrewMembersDirectory } from "./CrewMembersDirectory";

type CrewMembersPageClientProps = {
  crewId: string;
};

const MEMBERS_PAGE_SIZE = 8;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function appendUniqueMembers(currentMembers: CrewMember[], nextMembers: CrewMember[]): CrewMember[] {
  const seenUserIds = new Set(currentMembers.map((member) => member.userId));
  const uniqueNextMembers = nextMembers.filter((member) => {
    if (seenUserIds.has(member.userId)) {
      return false;
    }

    seenUserIds.add(member.userId);
    return true;
  });

  return [...currentMembers, ...uniqueNextMembers];
}

function isCrewHubResponse(value: unknown): value is CrewHubResponse {
  return typeof value === "object" && value !== null && "crewId" in value && "name" in value;
}

export function CrewMembersPageClient({ crewId }: CrewMembersPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const loadMoreTargetRef = useRef<HTMLDivElement | null>(null);
  const loadMoreInFlightRef = useRef(false);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  const loadMoreMembers = useCallback(async () => {
    if (!hasValidCrewId || isLoading || isLoadingMore || loadMoreInFlightRef.current || !hasNext) {
      return;
    }

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const response = await getCrewMembers(crewIdNumber, {
        page: page + 1,
        size: MEMBERS_PAGE_SIZE,
      });

      setMembers((currentMembers) => appendUniqueMembers(currentMembers, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("crew.members_load_more_failed", error, {
        level: "error",
        route: `/crews/${crewId}/members`,
      });
      setErrorMessage(
        getUserMessage(error, "크루원 목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      loadMoreInFlightRef.current = false;
      setIsLoadingMore(false);
    }
  }, [crewId, crewIdNumber, hasNext, hasValidCrewId, isLoading, isLoadingMore, page]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void Promise.allSettled([
      getCrewHub(crewIdNumber),
      getCrewMembers(crewIdNumber, { page: 0, size: MEMBERS_PAGE_SIZE }),
    ])
      .then(([crewResult, membersResult]) => {
        if (!isMounted) {
          return;
        }

        if (membersResult.status !== "fulfilled") {
          throw membersResult.reason;
        }

        if (crewResult.status === "fulfilled" && isCrewHubResponse(crewResult.value)) {
          setCrew(crewResult.value);
        }

        setMembers(appendUniqueMembers([], membersResult.value.items));
        setPage(membersResult.value.pageInfo.page);
        setHasNext(membersResult.value.pageInfo.hasNext);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.members_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: `/crews/${crewId}/members`,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "크루원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, crewIdNumber, hasValidCrewId, publicCrewPath, router]);

  useEffect(() => {
    if (!hasNext || isLoading || typeof IntersectionObserver === "undefined") {
      return;
    }

    const target = loadMoreTargetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMoreMembers();
      }
    }, { rootMargin: "120px" });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasNext, isLoading, loadMoreMembers]);

  if (!hasValidCrewId) {
    return (
      <CrewWorkspaceStatePage title="크루원">
        <p>잘못된 크루 경로입니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (isLoading) {
    return (
      <CrewWorkspaceStatePage>
        <p>크루원 목록을 불러오고 있습니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (errorMessage) {
    return (
      <CrewWorkspaceStatePage title="크루원">
        <p>{errorMessage}</p>
      </CrewWorkspaceStatePage>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="members" crew={resolvedCrew} crewId={crewId}>
      <CrewMembersDirectory
        members={members}
        hasNext={hasNext}
        isLoadingMore={isLoadingMore}
        loadMoreTargetRef={loadMoreTargetRef}
        onLoadMore={() => void loadMoreMembers()}
      />
    </CrewWorkspaceShell>
  );
}
