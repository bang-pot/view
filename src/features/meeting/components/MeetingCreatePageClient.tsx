"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewHub } from "@/shared/crew/client";
import { createMeeting } from "@/shared/meeting/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

type MeetingCreatePageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

export function MeetingCreatePageClient({ crewId }: MeetingCreatePageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [themeName, setThemeName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [totalCost, setTotalCost] = useState("");
  const [reservationLink, setReservationLink] = useState("");
  const [openChatLink, setOpenChatLink] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const createPath = useMemo(() => `/crews/${crewId}/meetings/new`, [crewId]);
  const meetingsPath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, createPath);

        if (destination) {
          router.replace(destination);
          return;
        }

        const crew = await getCrewHub(crewIdNumber);

        if (!isMounted) {
          return;
        }

        setCrewName(crew.name);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.create.bootstrap_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: createPath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "모임 생성 화면을 열지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [createPath, crewIdNumber, hasValidCrewId, publicCrewPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createMeeting(crewIdNumber, {
        date,
        time,
        place: place.trim(),
        themeName: themeName.trim(),
        capacity: Number(capacity),
        totalCost: totalCost.trim() ? Number(totalCost) : null,
        reservationLink: reservationLink.trim() || null,
        openChatLink: openChatLink.trim() || null,
        description: description.trim() || null,
      });

      router.push(`/crews/${crewId}/meetings/${created.meetingId}`);
    } catch (error) {
      reportOperationalError("meeting.create.submit_failed", error, {
        route: createPath,
      });
      setErrorMessage(
        getUserMessage(error, "모임 생성에 실패했습니다. 입력값을 다시 확인해 주세요."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>모임 만들기</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 생성 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>모임 만들기</h1>
      {crewName ? <p>{crewName} 크루의 새 모임을 만듭니다.</p> : null}
      <Link href={meetingsPath}>모임 목록으로 돌아가기</Link>

      <form onSubmit={handleSubmit}>
        <label htmlFor="meeting-date">날짜</label>
        <input id="meeting-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />

        <label htmlFor="meeting-time">시간</label>
        <input id="meeting-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />

        <label htmlFor="meeting-place">장소</label>
        <input id="meeting-place" value={place} onChange={(event) => setPlace(event.target.value)} />

        <label htmlFor="meeting-theme-name">테마명</label>
        <input id="meeting-theme-name" value={themeName} onChange={(event) => setThemeName(event.target.value)} />

        <label htmlFor="meeting-capacity">정원</label>
        <input
          id="meeting-capacity"
          type="number"
          min="1"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />

        <label htmlFor="meeting-total-cost">총 비용</label>
        <input
          id="meeting-total-cost"
          type="number"
          min="0"
          value={totalCost}
          onChange={(event) => setTotalCost(event.target.value)}
        />

        <label htmlFor="meeting-reservation-link">예약 링크</label>
        <input
          id="meeting-reservation-link"
          value={reservationLink}
          onChange={(event) => setReservationLink(event.target.value)}
        />

        <label htmlFor="meeting-open-chat-link">오픈채팅 링크</label>
        <input
          id="meeting-open-chat-link"
          value={openChatLink}
          onChange={(event) => setOpenChatLink(event.target.value)}
        />

        <label htmlFor="meeting-description">설명</label>
        <textarea
          id="meeting-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        {errorMessage ? <p>{errorMessage}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          모임 생성
        </button>
      </form>
    </main>
  );
}
