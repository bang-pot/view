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
import { createMeeting } from "@/shared/meeting/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { MeetingCreateForm } from "./MeetingCreateForm";
import { MeetingCreatePreviewPanel } from "./MeetingCreatePreviewPanel";
import type { MeetingEditorFormValues } from "./MeetingEditorForm";
import styles from "./MeetingCreatePageClient.module.css";

type MeetingCreatePageClientProps = {
  crewId: string;
  initialExploreDefaults?: {
    themeName?: string;
    storeName?: string;
    regionLabel?: string;
    genre?: string;
    difficulty?: string;
    runningTimeMinutes?: string;
  };
};

const EMPTY_VALUES: MeetingEditorFormValues = {
  title: "",
  date: "",
  time: "",
  place: "",
  themeName: "",
  capacity: "4",
  costMode: "TOTAL",
  recruitmentStatus: "recruiting",
  meetingStatus: "scheduled",
  totalCost: "",
  contactLink: "",
  description: "",
};
const DEFAULT_MEETING_PLACE = "장소 미정";

function buildExplorePrefillDescription(defaults: NonNullable<MeetingCreatePageClientProps["initialExploreDefaults"]>): string {
  const lines: string[] = [];

  if (defaults.storeName) {
    lines.push(`매장: ${defaults.storeName}`);
  }

  if (defaults.regionLabel) {
    lines.push(`지역: ${defaults.regionLabel}`);
  }

  if (defaults.genre) {
    lines.push(`장르: ${defaults.genre}`);
  }

  if (defaults.difficulty) {
    lines.push(`난이도: ${defaults.difficulty}`);
  }

  if (defaults.runningTimeMinutes) {
    lines.push(`플레이 시간: ${defaults.runningTimeMinutes}분`);
  }

  return lines.join("\n");
}

function buildInitialValues(
  defaults?: MeetingCreatePageClientProps["initialExploreDefaults"],
): MeetingEditorFormValues {
  if (!defaults) {
    return EMPTY_VALUES;
  }

  const placeParts = [defaults.regionLabel, defaults.storeName].filter(Boolean);
  const description = buildExplorePrefillDescription(defaults);

  return {
    ...EMPTY_VALUES,
    themeName: defaults.themeName ?? "",
    place: placeParts.join(" · "),
    description,
  };
}

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
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

function resolveMeetingPlace(values: MeetingEditorFormValues): string {
  const trimmedPlace = values.place.trim();

  return trimmedPlace || DEFAULT_MEETING_PLACE;
}

export function MeetingCreatePageClient({
  crewId,
  initialExploreDefaults,
}: MeetingCreatePageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [values, setValues] = useState<MeetingEditorFormValues>(() =>
    buildInitialValues(initialExploreDefaults),
  );
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

        setCrew(crew);
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

  function handleChange<TField extends keyof MeetingEditorFormValues>(
    field: TField,
    value: MeetingEditorFormValues[TField],
  ) {
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
        date: values.date.trim().replace(/^(\d{4})\.(\d{2})\.(\d{2})$/, "$1-$2-$3"),
        time: values.time,
        place: resolveMeetingPlace(values),
        themeName: values.themeName.trim(),
        capacity: Number(values.capacity),
        totalCost: resolveTotalCost(values),
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
      <main className={styles.page}>
        <p>모임 생성 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  return (
    <CrewWorkspaceShell activeMenu="meetings" crew={resolvedCrew} crewId={crewId}>
      <section className={styles.createPanel}>
        <header className={styles.header}>
          <div>
            <h1>모집 만들기</h1>
            <p>새 방탈출 모임을 만들고 크루원을 모집해보세요.</p>
          </div>
          <Link className={styles.backLink} href={meetingsPath}>
            모임 목록
          </Link>
        </header>
        <p className={styles.crewContext}>{resolvedCrew.name} 크루에서 작성 중</p>

        <div className={styles.createContent}>
          <div className={styles.formColumn}>
            <MeetingCreateForm
              values={values}
              onChange={handleChange}
              onSubmit={handleSubmit}
              errorMessage={errorMessage}
              isSubmitting={isSubmitting}
              submitLabel="모집 만들기"
              cancelHref={meetingsPath}
            />
          </div>
          <MeetingCreatePreviewPanel values={values} />
        </div>
      </section>
    </CrewWorkspaceShell>
  );
}
