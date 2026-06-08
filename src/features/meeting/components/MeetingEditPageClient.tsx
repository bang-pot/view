"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getMeetingDetail, updateMeeting } from "@/shared/meeting/client";
import type { MeetingDetail } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { MeetingCreateForm } from "./MeetingCreateForm";
import { MeetingCreatePreviewPanel } from "./MeetingCreatePreviewPanel";
import type { MeetingEditorFormValues } from "./MeetingEditorForm";
import styles from "./MeetingCreatePageClient.module.css";

const MEETING_EDIT_FORM_ID = "meeting-edit-form";

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

function toFormValues(detail: MeetingDetail): MeetingEditorFormValues {
  return {
    title: detail.title,
    date: detail.date,
    time: detail.time,
    place: detail.place,
    themeName: detail.themeName,
    capacity: String(detail.capacity),
    costMode: "TOTAL",
    recruitmentStatus: detail.status === "RECRUITMENT_CLOSED" ? "closed" : "recruiting",
    meetingStatus: "scheduled",
    totalCost: detail.totalCost === null ? "" : String(detail.totalCost),
    contactLink: detail.contactLink ?? "",
    description: detail.description ?? "",
  };
}

function resolveTotalCost(values: MeetingEditorFormValues): number | null {
  const parsedCost = Number(values.totalCost);

  if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
    return null;
  }

  if (values.costMode === "TOTAL") {
    return parsedCost;
  }

  const parsedCapacity = Number(values.capacity);

  if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
    return parsedCost;
  }

  return parsedCost * parsedCapacity;
}

export function MeetingEditPageClient({ crewId, meetingId }: MeetingEditPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
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
          setCrew(crew);
          setErrorMessage("이 모임은 지금 수정할 수 없습니다.");
          setIsLoading(false);
          return;
        }

        setCrew(crew);
        setValues(toFormValues(detail));
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

  function handleChange<TField extends keyof MeetingEditorFormValues>(
    field: TField,
    value: MeetingEditorFormValues[TField],
  ) {
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
        totalCost: resolveTotalCost(values),
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
      <main className={styles.page}>
        <p>모임 수정 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  if (!values) {
    return (
      <CrewWorkspaceShell activeMenu="meetings" crew={resolvedCrew} crewId={crewId}>
        <section className={styles.createPanel}>
          <header className={styles.header}>
            <div>
              <h1>모집 수정하기</h1>
              <p>기존 방탈출 모임 정보를 수정합니다.</p>
            </div>
            <Link className={styles.backLink} href={detailPath}>
              모임 상세
            </Link>
          </header>
          <p>{errorMessage ?? "이 모임은 지금 수정할 수 없습니다."}</p>
        </section>
      </CrewWorkspaceShell>
    );
  }

  return (
    <CrewWorkspaceShell activeMenu="meetings" crew={resolvedCrew} crewId={crewId}>
      <section className={styles.createPanel}>
        <header className={styles.header}>
          <div>
            <h1>모집 수정하기</h1>
            <p>기존 방탈출 모임 정보를 수정합니다.</p>
          </div>
          <Link className={styles.backLink} href={detailPath}>
            모임 상세
          </Link>
        </header>
        <p className={styles.crewContext}>{resolvedCrew.name} 크루에서 수정 중</p>

        <div className={styles.createContent}>
          <div className={styles.formColumn}>
            <MeetingCreateForm
              formId={MEETING_EDIT_FORM_ID}
              values={values}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
          <MeetingCreatePreviewPanel
            values={values}
            formId={MEETING_EDIT_FORM_ID}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel="모집 수정하기"
            cancelHref={detailPath}
          />
        </div>
      </section>
    </CrewWorkspaceShell>
  );
}
