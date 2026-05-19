"use client";

import Image from "next/image";
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
import styles from "./CrewPageClient.module.css";

type CrewMembersPageClientProps = {
  crewId: string;
};

const MEMBERS_PAGE_SIZE = 20;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function formatJoinedAt(joinedAt: string): string {
  const parsed = new Date(joinedAt);

  if (Number.isNaN(parsed.getTime())) {
    return `${joinedAt} 가입`;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}.${month}.${day} 가입`;
}

function isCrewHubResponse(value: unknown): value is CrewHubResponse {
  return typeof value === "object" && value !== null && "crewId" in value && "name" in value;
}

function toRoleLabel(role: CrewMember["role"]): string {
  return role === "LEADER" ? "크루장" : "크루원";
}

function toGenderLabel(gender: string | null): string {
  if (!gender) {
    return "미설정";
  }

  if (gender === "MALE" || gender === "남") {
    return "남";
  }

  if (gender === "FEMALE" || gender === "여") {
    return "여";
  }

  return gender;
}

function toMemberStat(member: CrewMember): string {
  return `${toGenderLabel(member.gender)} · ${member.escapeCount}방`;
}

function MemberAvatar({ member }: { member: CrewMember }) {
  if (member.profileImageUrl) {
    return (
      <Image
        src={member.profileImageUrl}
        alt={`${member.nickname} 프로필 이미지`}
        width={46}
        height={46}
        className={styles.memberAvatarImage}
      />
    );
  }

  return (
    <span
      className={styles.memberAvatarFallback}
      aria-label={`${member.nickname} 기본 프로필 이미지`}
    />
  );
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

      setMembers((currentMembers) => [...currentMembers, ...response.items]);
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

        setMembers(membersResult.value.items);
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
      <section className={styles.memberDirectoryPanel}>
        <header className={styles.memberDirectoryHeader}>
          <h1>크루원</h1>
          <span>총 {members.length}명</span>
        </header>

        {members.length === 0 ? (
          <p className={styles.memberEmpty}>아직 표시할 크루원이 없습니다.</p>
        ) : (
          <>
            <ul className={styles.memberDirectoryList} aria-label="크루원 목록">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className={styles.memberDirectoryItem}
                  data-member-role={member.role}
                >
                  <MemberAvatar member={member} />
                  <div className={styles.memberMainInfo}>
                    <div className={styles.memberNameLine}>
                      <strong>{member.nickname}</strong>
                      <span>{toRoleLabel(member.role)}</span>
                    </div>
                    <p>{member.bio ?? "한 줄 소개가 아직 없습니다."}</p>
                  </div>
                  <div className={styles.memberSubInfo}>
                    <strong>{toMemberStat(member)}</strong>
                    <span>{formatJoinedAt(member.joinedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
            {hasNext ? (
              <div ref={loadMoreTargetRef} className={styles.memberLoadGuide}>
                <span>{isLoadingMore ? "크루원을 더 불러오는 중입니다." : "스크롤하여 더 불러옵니다."}</span>
                {typeof IntersectionObserver === "undefined" ? (
                  <button type="button" onClick={() => void loadMoreMembers()}>
                    더 보기
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </CrewWorkspaceShell>
  );
}
