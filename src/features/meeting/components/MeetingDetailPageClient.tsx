"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  cancelMeetingJoin,
  closeMeetingRecruitment,
  getMeetingDetail,
  joinMeeting,
} from "@/shared/meeting/client";
import type { MeetingDetail } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { getMyMeetingLog } from "@/shared/log/client";
import type { MeetingLogMeResponse } from "@/shared/log/types";

import { MeetingDetailContent, type MeetingOperationAction } from "./MeetingDetailContent";

type MeetingDetailPageClientProps = {
  crewId: string;
  meetingId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

export function MeetingDetailPageClient({ crewId, meetingId }: MeetingDetailPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [myMeetingLog, setMyMeetingLog] = useState<MeetingLogMeResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null);
  const [operationErrorMessage, setOperationErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCancelingJoin, setIsCancelingJoin] = useState(false);
  const [activeOperation, setActiveOperation] = useState<MeetingOperationAction | null>(null);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}`, [crewId, meetingId]);
  const listPath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const editPath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}/edit`, [crewId, meetingId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const [me, crew, detail] = await Promise.all([
          getMe(),
          getCrewHub(crewIdNumber),
          getMeetingDetail(crewIdNumber, meetingIdNumber),
        ]);

        if (!isMounted) {
          return;
        }

        let nextMyMeetingLog: MeetingLogMeResponse | null = null;

        if (detail.status === "COMPLETED") {
          try {
            nextMyMeetingLog = await getMyMeetingLog(meetingIdNumber);
          } catch (error) {
            reportOperationalError("meeting.detail_log_lookup_failed", error, {
              level: "warn",
              route: routePath,
            });
          }
        }

        if (!isMounted) {
          return;
        }

        setCurrentUserId(me.user?.id ?? null);
        setCrew(crew);
        setMeeting(detail);
        setMyMeetingLog(nextMyMeetingLog);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.detail_load_failed", error, {
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

        setErrorMessage(getUserMessage(error, "모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidIds, meetingIdNumber, publicCrewPath, routePath, router]);

  async function handleJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsJoining(true);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);
    setOperationErrorMessage(null);

    try {
      const response = await joinMeeting(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        myParticipationStatus: response.myParticipationStatus,
      });
    } catch (error) {
      reportOperationalError("meeting.join_failed", error, {
        level: "warn",
        route: routePath,
      });

      if (isOperationalError(error) && error.code === "MEETING_PARTICIPATION_ALREADY_JOINED") {
        setMeeting({
          ...meeting,
          myParticipationStatus: "JOINED",
        });
        return;
      }

      setJoinErrorMessage(getUserMessage(error, "즉시 참여를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCancelJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsCancelingJoin(true);
    setCancelErrorMessage(null);
    setJoinErrorMessage(null);
    setOperationErrorMessage(null);

    try {
      const response = await cancelMeetingJoin(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        myParticipationStatus: response.myParticipationStatus,
      });
    } catch (error) {
      reportOperationalError("meeting.cancel_join_failed", error, {
        level: "warn",
        route: routePath,
      });

      setCancelErrorMessage(getUserMessage(error, "참여취소를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setIsCancelingJoin(false);
    }
  }

  async function handleMeetingOperation(action: MeetingOperationAction): Promise<void> {
    if (!meeting) {
      return;
    }

    setActiveOperation(action);
    setOperationErrorMessage(null);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);

    try {
      const response = await closeMeetingRecruitment(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        status: response.status,
      });
    } catch (error) {
      reportOperationalError("meeting.operation_failed", error, {
        level: "warn",
        route: routePath,
      });

      setOperationErrorMessage(getUserMessage(error, "모임 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setActiveOperation(null);
    }
  }

  if (!hasValidIds) {
    return (
      <main>
        <h1>모임 상세</h1>
        <p>올바르지 않은 모임 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 상세를 불러오고 있습니다.</p>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main>
        <h1>모임 상세</h1>
        <p>{errorMessage ?? "모임 상세를 불러오지 못했습니다."}</p>
        <Link href={listPath}>모임 목록으로 돌아가기</Link>
      </main>
    );
  }

  const myLogStatus = myMeetingLog?.status ?? null;
  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="meetings" crew={resolvedCrew} crewId={crewId}>
      <MeetingDetailContent
        crewId={crewId}
        meetingId={meetingId}
        listPath={listPath}
        editPath={editPath}
        meeting={meeting}
        currentUserId={currentUserId}
        myLogStatus={myLogStatus}
        joinErrorMessage={joinErrorMessage}
        cancelErrorMessage={cancelErrorMessage}
        operationErrorMessage={operationErrorMessage}
        isJoining={isJoining}
        isCancelingJoin={isCancelingJoin}
        activeOperation={activeOperation}
        onJoin={() => void handleJoin()}
        onCancelJoin={() => void handleCancelJoin()}
        onCloseRecruitment={() => void handleMeetingOperation("close-recruitment")}
      />
    </CrewWorkspaceShell>
  );
}
