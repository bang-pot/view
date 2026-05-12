"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub, getCrewPolicies } from "@/shared/crew/client";
import type { CrewHubResponse, CrewPolicy } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";

import {
  CrewWorkspaceShell,
  CrewWorkspaceStatePage,
} from "./CrewPageClient";
import styles from "./CrewPageClient.module.css";

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
      <CrewWorkspaceStatePage title="정책">
        <p>잘못된 크루 경로입니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (isLoading) {
    return (
      <CrewWorkspaceStatePage>
        <p>크루 정책을 불러오고 있습니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (errorMessage || !crew) {
    return (
      <CrewWorkspaceStatePage title="정책">
        <p>{errorMessage ?? "크루 정책을 불러오지 못했습니다."}</p>
      </CrewWorkspaceStatePage>
    );
  }

  const leader = isLeader(crew.myRole);

  return (
    <CrewWorkspaceShell activeMenu="policies" crew={crew} crewId={crewId}>
      <section className={styles.policyPanel} aria-labelledby="crew-policies-heading">
        <div className={styles.policyHeader}>
          <h2 id="crew-policies-heading">크루 정책</h2>
          <span>{policies.length}개 정책</span>
        </div>

        {policies.length === 0 ? (
          <div className={styles.policyEmpty} aria-label="정책 빈 상태">
            <span className={styles.policyEmptyVisual} aria-hidden="true" />
            <p className={styles.policyEmptyTitle}>자유로운 분위기로 운영되고 있네요</p>
            <p className={styles.policyEmptyDescription}>아직 등록된 정책이 없습니다.</p>
            {leader ? (
              <Button type="button" className={styles.policyEmptyButton}>
                정책 추가하러 가기 →
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className={styles.policyList} aria-label="크루 정책 목록">
            {policies.map((policy) => {
              const expanded = expandedPolicyIds.includes(policy.policyId);

              return (
                <li key={policy.policyId}>
                  <article className={styles.policyCard}>
                    <button
                      type="button"
                      className={styles.policyToggle}
                      aria-expanded={expanded}
                      onClick={() => togglePolicy(policy.policyId)}
                    >
                      <span>{policy.title}</span>
                      <span className={styles.policyToggleIcon} aria-hidden="true">
                        {expanded ? "-" : "+"}
                      </span>
                    </button>
                    {expanded ? (
                      <div className={styles.policyContent}>
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
      </section>
    </CrewWorkspaceShell>
  );
}
