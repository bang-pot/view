"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewMembers } from "@/shared/crew/client";
import type { CrewMember } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewMembersPageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function formatJoinedAt(joinedAt: string): string {
  const parsed = new Date(joinedAt);

  if (Number.isNaN(parsed.getTime())) {
    return joinedAt;
  }

  return parsed.toISOString().slice(0, 10);
}

function compareMembers(left: CrewMember, right: CrewMember): number {
  if (left.role === "LEADER" && right.role !== "LEADER") {
    return -1;
  }

  if (left.role !== "LEADER" && right.role === "LEADER") {
    return 1;
  }

  return Date.parse(right.joinedAt) - Date.parse(left.joinedAt);
}

export function CrewMembersPageClient({ crewId }: CrewMembersPageClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void getCrewMembers(crewIdNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setMembers([...response].sort(compareMembers));
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

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루원</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>크루원 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main>
        <h1>크루원</h1>
        <p>{errorMessage}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>크루원</h1>
      <p>가입한 크루원만 볼 수 있는 읽기 전용 목록입니다.</p>
      <Link href={hubPath}>크루 허브로 돌아가기</Link>

      {members.length === 0 ? (
        <p>아직 표시할 크루원이 없습니다.</p>
      ) : (
        <ul aria-label="크루원 목록">
          {members.map((member) => (
            <li key={member.userId}>
              {member.profileImageUrl ? (
                <Image
                  src={member.profileImageUrl}
                  alt={`${member.nickname} 프로필 이미지`}
                  width={40}
                  height={40}
                />
              ) : (
                <div aria-label={`${member.nickname} 기본 아바타`}>
                  기본 아바타
                </div>
              )}
              <p>{member.nickname}</p>
              <p>역할: {member.role}</p>
              <p>가입일: {formatJoinedAt(member.joinedAt)}</p>
              <p>소개: {member.bio ?? "소개 없음"}</p>
              <p>성별: {member.gender ?? "미설정"}</p>
              <p>탈주 횟수: {member.escapeCount}회</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
