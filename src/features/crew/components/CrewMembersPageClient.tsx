"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { transferCrewLeadership, getCrewMembers } from "@/shared/crew/client";
import type { CrewMember } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transferErrorMessage, setTransferErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTransferringUserId, setIsTransferringUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);
  const currentUserRole = useMemo(
    () => members.find((member) => member.userId === currentUserId)?.role ?? null,
    [currentUserId, members],
  );
  const currentUserIsLeader = currentUserRole === "LEADER";

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void Promise.allSettled([getCrewMembers(crewIdNumber), getMe()])
      .then(([membersResult, meResult]) => {
        if (!isMounted) {
          return;
        }

        if (membersResult.status !== "fulfilled") {
          throw membersResult.reason;
        }

        setMembers([...membersResult.value].sort(compareMembers));

        if (
          meResult.status === "fulfilled" &&
          meResult.value.authStatus === "FULL" &&
          meResult.value.user
        ) {
          setCurrentUserId(meResult.value.user.id);
        } else {
          setCurrentUserId(null);
        }

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

  async function handleTransferLeadership(targetMember: CrewMember) {
    if (!currentUserIsLeader || isTransferringUserId !== null) {
      return;
    }

    const shouldTransfer = window.confirm(
      `${targetMember.nickname}에게 크루장을 위임할까요?\n\n위임 후에는 크루 관리 권한이 즉시 새로운 크루장에게 넘어갑니다`,
    );

    if (!shouldTransfer) {
      return;
    }

    try {
      setTransferErrorMessage(null);
      setSuccessMessage(null);
      setIsTransferringUserId(targetMember.userId);

      const response = await transferCrewLeadership(crewIdNumber, targetMember.userId);

      setMembers((previousMembers) => {
        const nextMembers = previousMembers.map((member) => {
          if (member.userId === response.leaderUserId) {
            return {
              ...member,
              role: "LEADER" as const,
            };
          }

          if (member.userId === currentUserId) {
            return {
              ...member,
              role: "MEMBER" as const,
            };
          }

          return member;
        });

        return nextMembers.sort(compareMembers);
      });
      setSuccessMessage("크루장이 변경되었습니다");
    } catch (error) {
      reportOperationalError("crew.transfer_leadership_failed", error, {
        level: "warn",
        route: `/crews/${crewId}/members`,
      });

      if (
        isOperationalError(error) &&
        error.code === "CREW_TRANSFER_LEADERSHIP_TARGET_NOT_ALLOWED"
      ) {
        setTransferErrorMessage("현재 일반 크루원에게만 크루장을 위임할 수 있어요.");
      } else if (isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED") {
        setTransferErrorMessage("현재 크루장만 위임할 수 있어요.");
      } else {
        setTransferErrorMessage(
          getUserMessage(error, "크루장 위임에 실패했습니다. 잠시 후 다시 시도해 주세요."),
        );
      }
    } finally {
      setIsTransferringUserId(null);
    }
  }

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
      {successMessage ? <p>{successMessage}</p> : null}
      {transferErrorMessage ? <p>{transferErrorMessage}</p> : null}

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
              {currentUserIsLeader && member.role === "MEMBER" ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleTransferLeadership(member);
                  }}
                  disabled={isTransferringUserId !== null}
                >
                  {isTransferringUserId === member.userId
                    ? "위임 중..."
                    : `${member.nickname}에게 크루장 위임`}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
