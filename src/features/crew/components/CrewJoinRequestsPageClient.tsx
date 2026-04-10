"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { toCompletionPath } from "@/shared/auth/guards";
import {
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import {
  approveCrewJoinRequest,
  getCrewJoinRequests,
  rejectCrewJoinRequest,
} from "@/shared/crew/client";
import type { CrewJoinRequestRecord, CrewJoinRequestStatus } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewJoinRequestsPageClientProps = {
  crewId: string;
};

type ProcessingState = {
  requestId: number;
  action: "approve" | "reject";
} | null;

function updateRequestStatus(
  items: CrewJoinRequestRecord[],
  requestId: number,
  status: CrewJoinRequestStatus,
): CrewJoinRequestRecord[] {
  return items.map((item) => (item.requestId === requestId ? { ...item, status } : item));
}

export function CrewJoinRequestsPageClient({ crewId }: CrewJoinRequestsPageClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CrewJoinRequestRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingState, setProcessingState] = useState<ProcessingState>(null);

  const crewIdNumber = Number(crewId);
  const route = useMemo(() => `/crews/${crewId}/join-requests`, [crewId]);

  useEffect(() => {
    if (!Number.isFinite(crewIdNumber)) {
      setErrorMessage("잘못된 크루 경로입니다.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void getMe()
      .then(async (me) => {
        if (!isMounted) {
          return;
        }

        if (me.authStatus === "GUEST") {
          router.replace(`/login?redirectTo=${encodeURIComponent(route)}`);
          return;
        }

        if (me.authStatus !== "FULL" || me.completionRequired) {
          router.replace(toCompletionPath(route));
          return;
        }

        const response = await getCrewJoinRequests(crewIdNumber);

        if (!isMounted) {
          return;
        }

        setItems(response);
        setIsLoading(false);
      })
      .catch((error) => {
        const operationalError = toOperationalError(error);
        const level = operationalError.code === "AUTH_ACCESS_DENIED" ? "warn" : "error";

        reportOperationalError("crew.join_request_management_load_failed", operationalError, {
          level,
          route,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            operationalError,
            "가입 신청 관리 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, route, router]);

  async function handleApprove(requestId: number) {
    setProcessingState({ requestId, action: "approve" });
    setErrorMessage(null);

    try {
      await approveCrewJoinRequest(crewIdNumber, requestId);
      setItems((current) => updateRequestStatus(current, requestId, "APPROVED"));
    } catch (error) {
      reportOperationalError("crew.join_request_approve_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "가입 신청 승인에 실패했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setProcessingState(null);
    }
  }

  async function handleReject(requestId: number) {
    setProcessingState({ requestId, action: "reject" });
    setErrorMessage(null);

    try {
      await rejectCrewJoinRequest(crewIdNumber, requestId);
      setItems((current) => updateRequestStatus(current, requestId, "REJECTED"));
    } catch (error) {
      reportOperationalError("crew.join_request_reject_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "가입 신청 거절에 실패했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setProcessingState(null);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>가입 신청 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>가입 신청 관리</h1>
      <p>Crew ID: {crewId}</p>
      {errorMessage ? <p>{errorMessage}</p> : null}

      <ul>
        {items.map((item) => {
          const isProcessing = processingState?.requestId === item.requestId;

          return (
            <li key={item.requestId}>
              <p>{item.nickname}</p>
              <p>{item.message ?? "메시지 없음"}</p>
              <p>{item.status}</p>
              {item.status === "PENDING" ? (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(item.requestId)}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleReject(item.requestId)}
                  >
                    거절
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
