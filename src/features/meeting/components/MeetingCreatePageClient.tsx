"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { createMeeting } from "@/shared/meeting/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { MeetingEditorForm, type MeetingEditorFormValues } from "./MeetingEditorForm";

type MeetingCreatePageClientProps = {
  crewId: string;
};

const EMPTY_VALUES: MeetingEditorFormValues = {
  title: "",
  date: "",
  time: "",
  place: "",
  themeName: "",
  capacity: "4",
  totalCost: "",
  contactLink: "",
  description: "",
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

export function MeetingCreatePageClient({ crewId }: MeetingCreatePageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [values, setValues] = useState<MeetingEditorFormValues>(EMPTY_VALUES);
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

  function handleChange(field: keyof MeetingEditorFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createMeeting(crewIdNumber, {
        title: values.title.trim(),
        date: values.date,
        time: values.time,
        place: values.place.trim(),
        themeName: values.themeName.trim(),
        capacity: Number(values.capacity),
        totalCost: values.totalCost.trim() ? Number(values.totalCost) : null,
        contactLink: values.contactLink.trim() || null,
        description: values.description.trim() || null,
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
        <p>올바르지 않은 크루 경로입니다.</p>
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

      <MeetingEditorForm
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        submitLabel="모임 생성"
      />
    </main>
  );
}
