"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  cancelMeetingJoin,
  getMeetingDetail,
  joinMeeting,
} from "@/shared/meeting/client";
import type {
  MeetingDetail,
  MeetingParticipationStatus,
} from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type MeetingDetailPageClientProps = {
  crewId: string;
  meetingId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function toDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "미입력";
  }

  return String(value);
}

function getParticipationLabel(status: MeetingParticipationStatus): string {
  if (status === "JOINED") {
    return "참여 중";
  }

  return "지금 바로 참여할 수 있어요.";
}

export function MeetingDetailPageClient({
  crewId,
  meetingId,
}: MeetingDetailPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const routePath = useMemo(
    () => `/crews/${crewId}/meetings/${meetingId}`,
    [crewId, meetingId],
  );
  const listPath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    void Promise.all([
      getMe(),
      getCrewHub(crewIdNumber),
      getMeetingDetail(crewIdNumber, meetingIdNumber),
    ])
      .then(([me, crew, detail]) => {
        if (!isMounted) {
          return;
        }

        setCurrentUserId(me.user?.id ?? null);
        setCrewName(crew.name);
        setMeeting(detail);
        setErrorMessage(null);
        setIsLoading(false);
      })
      .catch((error) => {
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

        setErrorMessage(
          getUserMessage(
            error,
            "모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    crewIdNumber,
    hasValidIds,
    meetingIdNumber,
    publicCrewPath,
    routePath,
    router,
  ]);

  async function handleJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsJoining(true);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);

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

      setJoinErrorMessage(
        getUserMessage(
          error,
          "즉시 참여를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCancelJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsCanceling(true);
    setCancelErrorMessage(null);
    setJoinErrorMessage(null);

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

      setCancelErrorMessage(
        getUserMessage(
          error,
          "참여취소를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsCanceling(false);
    }
  }

  if (!hasValidIds) {
    return (
      <main>
        <h1>모임 상세</h1>
        <p>잘못된 모임 경로입니다.</p>
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

  const isMeetingHost = currentUserId !== null && meeting.hostUserId === currentUserId;
  const canCancelJoin =
    meeting.myParticipationStatus === "JOINED" && !isMeetingHost;

  return (
    <main>
      <h1>모임 상세</h1>
      {crewName ? <p>{crewName} 크루의 모임 상세입니다.</p> : null}
      <Link href={listPath}>모임 목록으로 돌아가기</Link>

      <section aria-label="모임 참가 상태">
        <h2>내 참가 상태</h2>
        <p>내 참가 상태: {meeting.myParticipationStatus}</p>
        {meeting.myParticipationStatus === "NOT_JOINED" ? (
          <button type="button" onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "참여 처리 중..." : "참여하기"}
          </button>
        ) : null}
        {canCancelJoin ? (
          <button type="button" onClick={handleCancelJoin} disabled={isCanceling}>
            {isCanceling ? "참여취소 처리 중..." : "참여취소"}
          </button>
        ) : null}
        <p>{getParticipationLabel(meeting.myParticipationStatus)}</p>
        {joinErrorMessage ? <p>{joinErrorMessage}</p> : null}
        {cancelErrorMessage ? <p>{cancelErrorMessage}</p> : null}
      </section>

      <section aria-label="모임 상세 정보">
        <h2>{meeting.themeName}</h2>
        <p>모임 ID: {meeting.meetingId}</p>
        <p>모집 상태: {meeting.status}</p>
        <p>결과 상태: {meeting.result}</p>
        <p>날짜: {meeting.date}</p>
        <p>시간: {meeting.time}</p>
        <p>장소: {meeting.place}</p>
        <p>정원: {meeting.capacity}명</p>
        <p>총 비용: {toDisplay(meeting.totalCost)}</p>
        <p>예약 링크: {toDisplay(meeting.reservationLink)}</p>
        <p>오픈채팅 링크: {toDisplay(meeting.openChatLink)}</p>
        <p>설명: {toDisplay(meeting.description)}</p>
      </section>
    </main>
  );
}
