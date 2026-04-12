"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { toCompletionPath } from "@/shared/auth/guards";
import {
  getUserMessage,
  isOperationalError,
  toOperationalError,
} from "@/shared/errors/operational";
import { getCrewHub, updateCrewVisibility } from "@/shared/crew/client";
import type { CrewHubResponse, CrewVisibility } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewSettingsPageClientProps = {
  crewId: string;
};

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function getVisibilityGuide(visibility: CrewVisibility): string {
  if (visibility === "PUBLIC") {
    return "공개: 탐색에 노출되고 직접 가입 신청을 받을 수 있어요";
  }

  return "비공개: 탐색에 노출되지 않고 직접 가입 신청을 받을 수 없어요";
}

export function CrewSettingsPageClient({ crewId }: CrewSettingsPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const route = useMemo(() => `/crews/${crewId}/settings`, [crewId]);
  const hubPath = useMemo(() => `/crews/${crewId}`, [crewId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      setErrorMessage("잘못된 크루 경로입니다.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        if (me.authStatus === "GUEST") {
          router.replace(`/login?redirectTo=${encodeURIComponent(route)}`);
          return;
        }

        if (me.authStatus !== "FULL" || me.completionRequired) {
          router.replace(toCompletionPath(route));
          return;
        }

        const response = await getCrewHub(crewIdNumber);

        if (!isMounted) {
          return;
        }

        setCrew(response);
        setIsLoading(false);
      } catch (error) {
        const operationalError = toOperationalError(error);
        const shouldRedirect =
          isOperationalError(operationalError) &&
          operationalError.code === "AUTH_ACCESS_DENIED";

        reportOperationalError("crew.visibility_settings_load_failed", operationalError, {
          level: shouldRedirect ? "warn" : "error",
          route,
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
            operationalError,
            "크루 설정 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, route, router]);

  async function handleToggleChange() {
    if (!crew) {
      return;
    }

    const nextVisibility: CrewVisibility = crew.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const response = await updateCrewVisibility(crew.crewId, nextVisibility);
      setCrew((current) => (current ? { ...current, visibility: response.visibility } : current));
    } catch (error) {
      reportOperationalError("crew.visibility_update_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "크루 공개 범위를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루 설정</h1>
        <p>잘못된 크루 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>크루 설정을 불러오고 있습니다.</p>
      </main>
    );
  }

  if (errorMessage && !crew) {
    return (
      <main>
        <h1>크루 설정</h1>
        <p>{errorMessage}</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  if (!crew) {
    return null;
  }

  if (crew.myRole !== "LEADER") {
    return (
      <main>
        <h1>크루 설정</h1>
        <p>크루장만 공개 범위를 변경할 수 있습니다.</p>
        <Link href={hubPath}>크루 허브로 돌아가기</Link>
      </main>
    );
  }

  const isPublic = crew.visibility === "PUBLIC";

  return (
    <main>
      <h1>크루 설정</h1>
      <p>{crew.name}</p>
      <p>현재 공개 상태: {crew.visibility}</p>
      <p>{getVisibilityGuide("PUBLIC")}</p>
      <p>{getVisibilityGuide("PRIVATE")}</p>
      {errorMessage ? <p>{errorMessage}</p> : null}

      <label>
        <span>공개 크루 여부</span>
        <input
          type="checkbox"
          role="switch"
          aria-label="공개 크루 여부"
          checked={isPublic}
          disabled={isUpdating}
          onChange={handleToggleChange}
        />
      </label>

      <Link href={hubPath}>크루 허브로 돌아가기</Link>
    </main>
  );
}
