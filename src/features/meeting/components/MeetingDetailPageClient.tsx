"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewHub } from "@/shared/crew/client";
import { getMeetingDetail } from "@/shared/meeting/client";
import type { MeetingDetail } from "@/shared/meeting/types";
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

export function MeetingDetailPageClient({ crewId, meetingId }: MeetingDetailPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}`, [crewId, meetingId]);
  const listPath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    void Promise.all([getCrewHub(crewIdNumber), getMeetingDetail(crewIdNumber, meetingIdNumber)])
      .then(([crew, detail]) => {
        if (!isMounted) {
          return;
        }

        setCrewName(crew.name);
        setMeeting(detail);
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
          getUserMessage(error, "모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidIds, meetingIdNumber, publicCrewPath, routePath, router]);

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

      <section aria-label="모임 핵심 정보">
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
