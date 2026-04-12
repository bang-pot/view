"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewHub, getCrewPolicies } from "@/shared/crew/client";
import type { CrewHubResponse, CrewPolicy } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewPoliciesPageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function isLeader(role: string): boolean {
  return role === "LEADER";
}

function formatPolicyContent(content: string): string[] {
  return content.split(/\r?\n/);
}

export function CrewPoliciesPageClient({ crewId }: CrewPoliciesPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [policies, setPolicies] = useState<CrewPolicy[]>([]);
  const [expandedPolicyIds, setExpandedPolicyIds] = useState<number[]>([]);
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

    void Promise.all([getCrewHub(crewIdNumber), getCrewPolicies(crewIdNumber)])
      .then(([crewResponse, policiesResponse]) => {
        if (!isMounted) {
          return;
        }

        setCrew(crewResponse);
        setPolicies(policiesResponse);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.policies_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: `/crews/${crewId}/policies`,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "크루 정책을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, crewIdNumber, hasValidCrewId, publicCrewPath, router]);

  function togglePolicy(policyId: number) {
    setExpandedPolicyIds((current) =>
      current.includes(policyId)
        ? current.filter((id) => id !== policyId)
        : [...current, policyId],
    );
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>정책</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>크루 정책을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage || !crew) {
    return (
      <main>
        <h1>정책</h1>
        <p>{errorMessage ?? "크루 정책을 불러오지 못했습니다."}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  const leader = isLeader(crew.myRole);

  return (
    <main>
      <h1>정책</h1>
      <p>가입한 크루원만 볼 수 있는 읽기 전용 정책 페이지입니다.</p>
      <Link href={hubPath}>크루 허브로 돌아가기</Link>

      {policies.length === 0 ? (
        <section aria-label="정책 빈 상태">
          <p>자유로운 분위기로 운영되고 있네요</p>
          {leader ? (
            <button type="button" disabled>
              정책 추가하러 가기
            </button>
          ) : null}
        </section>
      ) : (
        <ul aria-label="정책 목록">
          {policies.map((policy) => {
            const expanded = expandedPolicyIds.includes(policy.policyId);

            return (
              <li key={policy.policyId}>
                <article>
                  <button type="button" onClick={() => togglePolicy(policy.policyId)}>
                    {policy.title}
                  </button>
                  {expanded ? (
                    <div>
                      {formatPolicyContent(policy.content).map((line, index) => (
                        <p key={`${policy.policyId}-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
