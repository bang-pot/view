"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getPendingCrewJoinRequests } from "@/shared/crew/client";
import type { PendingCrewJoinRequestSummary } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewPageClientProps = {
  crewId: string;
};

export function CrewPageClient({ crewId }: CrewPageClientProps) {
  const [pendingRequests, setPendingRequests] = useState<PendingCrewJoinRequestSummary[] | null>(
    null,
  );
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const crewIdNumber = Number(crewId);
  const managePath = useMemo(() => `/crews/${crewId}/join-requests`, [crewId]);

  useEffect(() => {
    if (!Number.isFinite(crewIdNumber)) {
      return;
    }

    let isMounted = true;

    void getPendingCrewJoinRequests(crewIdNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setPendingRequests(response);
      })
      .catch((error) => {
        const level =
          isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED" ? "warn" : "error";

        reportOperationalError("crew.join_request_summary_failed", error, {
          level,
          route: `/crews/${crewId}`,
        });

        if (!isMounted) {
          return;
        }

        if (isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED") {
          setPendingRequests(null);
          return;
        }

        setSummaryError(
          getUserMessage(error, "가입 신청 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, crewIdNumber]);

  return (
    <main>
      <h1>Crew</h1>
      <p>Crew ID: {crewId}</p>

      {pendingRequests ? (
        <section>
          <h2>가입 신청 관리</h2>
          <p>대기 중 {pendingRequests.length}건</p>
          {pendingRequests.length > 0 ? (
            <p>신청자: {pendingRequests.map((request) => request.nickname).join(", ")}</p>
          ) : (
            <p>대기 중인 가입 신청이 없습니다.</p>
          )}
          <Link href={managePath}>가입 신청 관리</Link>
        </section>
      ) : null}

      {summaryError ? <p>{summaryError}</p> : null}
    </main>
  );
}
