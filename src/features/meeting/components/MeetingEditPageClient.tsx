"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getMeetingDetail, updateMeeting } from "@/shared/meeting/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { MeetingEditorForm, type MeetingEditorFormValues } from "./MeetingEditorForm";

type MeetingEditPageClientProps = {
  crewId: string;
  meetingId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function isEditableStatus(status: string): boolean {
  return status === "RECRUITING" || status === "RECRUITMENT_CLOSED";
}

export function MeetingEditPageClient({ crewId, meetingId }: MeetingEditPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [values, setValues] = useState<MeetingEditorFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const editPath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}/edit`, [crewId, meetingId]);
  const detailPath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}`, [crewId, meetingId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, editPath);

        if (destination) {
          router.replace(destination);
          return;
        }

        const [crew, detail] = await Promise.all([
          getCrewHub(crewIdNumber),
          getMeetingDetail(crewIdNumber, meetingIdNumber),
        ]);

        if (!isMounted) {
          return;
        }

        if (detail.hostUserId !== me.user?.id || !isEditableStatus(detail.status)) {
          setCrewName(crew.name);
          setErrorMessage("이 모임은 지금 수정할 수 없습니다.");
          setIsLoading(false);
          return;
        }

        setCrewName(crew.name);
        setValues({
          title: detail.title,
          date: detail.date,
          time: detail.time,
          place: detail.place,
          themeName: detail.themeName,
          capacity: String(detail.capacity),
          totalCost: detail.totalCost === null ? "" : String(detail.totalCost),
          contactLink: detail.contactLink ?? "",
          description: detail.description ?? "",
        });
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.edit.bootstrap_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: editPath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "모임 수정 화면을 열지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, editPath, hasValidIds, meetingIdNumber, publicCrewPath, router]);

  function handleChange(field: keyof MeetingEditorFormValues, value: string) {
    setValues((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await updateMeeting(crewIdNumber, meetingIdNumber, {
        title: values.title.trim(),
        themeName: values.themeName.trim(),
        place: values.place.trim(),
        date: values.date,
        time: values.time,
        capacity: Number(values.capacity),
        totalCost: values.totalCost.trim() ? Number(values.totalCost) : null,
        contactLink: values.contactLink.trim() || null,
        description: values.description.trim() || null,
      });

      router.push(`${detailPath}?notice=meeting-updated`);
    } catch (error) {
      reportOperationalError("meeting.edit.submit_failed", error, {
        route: editPath,
      });
      setErrorMessage(
        getUserMessage(error, "모임 정보를 수정하지 못했습니다. 입력값을 다시 확인해 주세요."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasValidIds) {
    return (
      <main>
        <h1>모임 수정</h1>
        <p>올바르지 않은 모임 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 수정 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  if (!values) {
    return (
      <main>
        <h1>모임 수정</h1>
        {crewName ? <p>{crewName} 크루의 모임 수정 화면입니다.</p> : null}
        <p>{errorMessage ?? "이 모임은 지금 수정할 수 없습니다."}</p>
        <Link href={detailPath}>모임 상세로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>모임 수정</h1>
      {crewName ? <p>{crewName} 크루의 모임 정보를 수정합니다.</p> : null}
      <Link href={detailPath}>모임 상세로 돌아가기</Link>

      <MeetingEditorForm
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        submitLabel="모임 수정 저장"
      />
    </main>
  );
}
