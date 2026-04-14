"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getMeetings } from "@/shared/meeting/client";
import {
  getMeetingStatusDescription,
  getMeetingStatusLabel,
} from "@/shared/meeting/presentation";
import type { MeetingListItem } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type MeetingListPageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

export function MeetingListPageClient({ crewId }: MeetingListPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);
  const createPath = useMemo(() => `/crews/${crewId}/meetings/new`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void Promise.all([getCrewHub(crewIdNumber), getMeetings(crewIdNumber)])
      .then(([crew, meetings]) => {
        if (!isMounted) {
          return;
        }

        setCrewName(crew.name);
        setItems(meetings);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.list_load_failed", error, {
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
          getUserMessage(error, "모임 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, routePath, router]);

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>모임 목록</h1>
        <p>올바르지 않은 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main>
        <h1>모임 목록</h1>
        <p>{errorMessage}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>모임 목록</h1>
      {crewName ? <p>{crewName} 크루의 모임입니다.</p> : null}
      <Link href={hubPath}>크루 허브로 돌아가기</Link>
      <div>
        <Link href={createPath}>모임 만들기</Link>
      </div>

      {items.length === 0 ? (
        <p>아직 등록된 모임이 없습니다.</p>
      ) : (
        <ul aria-label="모임 목록">
          {items.map((meeting) => (
            <li key={meeting.meetingId}>
              <article>
                <h2>
                  <Link href={`/crews/${crewId}/meetings/${meeting.meetingId}`}>
                    {meeting.title ?? meeting.themeName}
                  </Link>
                </h2>
                <p>테마명: {meeting.themeName}</p>
                <p>장소: {meeting.place}</p>
                <p>
                  일시: {meeting.date} {meeting.time}
                </p>
                <p>정원: {meeting.capacity}명</p>
                <p>모집 상태: {getMeetingStatusLabel(meeting.status)}</p>
                <p>{getMeetingStatusDescription(meeting.status)}</p>
                <p>결과 상태: {meeting.result}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
