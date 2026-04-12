"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewPageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function isLeader(role: string): boolean {
  return role === "LEADER";
}

export function CrewPageClient({ crewId }: CrewPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);
  const policiesPath = useMemo(() => `/crews/${crewId}/policies`, [crewId]);
  const membersPath = useMemo(() => `/crews/${crewId}/members`, [crewId]);
  const settingsPath = useMemo(() => `/crews/${crewId}/settings`, [crewId]);
  const manageJoinRequestsPath = useMemo(() => `/crews/${crewId}/join-requests`, [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void getCrewHub(crewIdNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCrew(response);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.hub_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: `/crews/${crewId}`,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "크루 내부 허브를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
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
        <h1>크루 허브</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>크루 내부 공간을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (!crew) {
    return (
      <main>
        <h1>크루 허브</h1>
        <p>{errorMessage ?? "크루 내부 허브를 불러오지 못했습니다."}</p>
      </main>
    );
  }

  const leader = isLeader(crew.myRole);

  return (
    <main>
      <div>
        <section aria-label="크루 요약 카드">
          <h1>{crew.name}</h1>
          <p>Crew ID: {crew.crewId}</p>
          <p>{crew.description ?? "크루 소개가 아직 없습니다."}</p>
          <p>공개 범위: {crew.visibility}</p>
          <p>내 역할: {crew.myRole}</p>
        </section>

        <nav aria-label="크루 네비게이션">
          <ul>
            <li>
              <Link href={`/crews/${crew.crewId}`}>홈</Link>
            </li>
            <li>
              <Link href={policiesPath}>정책</Link>
            </li>
            <li>
              <Link href={membersPath}>크루원</Link>
            </li>
            {leader ? (
              <li>
                <Link href={settingsPath}>설정</Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>

      <section aria-label="공통 안내 영역">
        {crew.hasNotice ? <p>공지사항이 등록되어 있습니다.</p> : null}
        {leader && typeof crew.pendingJoinRequestCount === "number" ? (
          <>
            <p>가입 신청 대기: {crew.pendingJoinRequestCount}건</p>
            <Link href={manageJoinRequestsPath}>가입 신청 관리</Link>
          </>
        ) : null}
        {!crew.hasNotice && !leader ? <p>이 크루의 공통 안내를 준비 중입니다.</p> : null}
      </section>

      <section aria-label="본문 캔버스">
        <h2>본문 캔버스</h2>
        <p>선택한 크루 콘텐츠는 다음 라운드에서 연결됩니다.</p>
      </section>
    </main>
  );
}
