"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  getMeetingDetail,
  requestMeetingParticipation,
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
  if (status === "PENDING") {
    return "승인 대기 중";
  }

  if (status === "APPROVED") {
    return "참가 중";
  }

  return "참가 신청 가능";
}

export function MeetingDetailPageClient({
  crewId,
  meetingId,
}: MeetingDetailPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [participationErrorMessage, setParticipationErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingParticipation, setIsSubmittingParticipation] = useState(false);

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
      getCrewHub(crewIdNumber),
      getMeetingDetail(crewIdNumber, meetingIdNumber),
    ])
      .then(([crew, detail]) => {
        if (!isMounted) {
          return;
        }

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

  async function handleParticipationRequest(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsSubmittingParticipation(true);
    setParticipationErrorMessage(null);

    try {
      const response = await requestMeetingParticipation(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        myParticipationStatus: response.myParticipationStatus,
      });
    } catch (error) {
      reportOperationalError("meeting.participation_request_failed", error, {
        level: "warn",
        route: routePath,
      });

      if (isOperationalError(error)) {
        if (error.code === "MEETING_PARTICIPATION_ALREADY_PENDING") {
          setMeeting({
            ...meeting,
            myParticipationStatus: "PENDING",
          });
          setIsSubmittingParticipation(false);
          return;
        }

        if (error.code === "MEETING_PARTICIPATION_ALREADY_APPROVED") {
          setMeeting({
            ...meeting,
            myParticipationStatus: "APPROVED",
          });
          setIsSubmittingParticipation(false);
          return;
        }
      }

      setParticipationErrorMessage(
        getUserMessage(
          error,
          "참가 신청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsSubmittingParticipation(false);
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

  return (
    <main>
      <h1>모임 상세</h1>
      {crewName ? <p>{crewName} 크루의 모임 상세입니다.</p> : null}
      <Link href={listPath}>모임 목록으로 돌아가기</Link>

      <section aria-label="모임 참가 상태">
        <h2>내 참가 상태</h2>
        <p>내 참가 상태: {meeting.myParticipationStatus}</p>
        {meeting.myParticipationStatus === "NOT_REQUESTED" ? (
          <button type="button" onClick={handleParticipationRequest} disabled={isSubmittingParticipation}>
            {isSubmittingParticipation ? "참가 신청 중..." : "참가 신청"}
          </button>
        ) : null}
        {meeting.myParticipationStatus !== "NOT_REQUESTED" ? (
          <p>{getParticipationLabel(meeting.myParticipationStatus)}</p>
        ) : null}
        {participationErrorMessage ? <p>{participationErrorMessage}</p> : null}
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
