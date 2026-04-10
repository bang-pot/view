"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { toCompletionPath } from "@/shared/auth/guards";
import { getUserMessage, toOperationalError } from "@/shared/errors/operational";
import { createCrewInvite, getCrewInviteCandidates } from "@/shared/crew/client";
import type { CrewInviteCandidate } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type CrewInvitesPageClientProps = {
  crewId: string;
};

export function CrewInvitesPageClient({ crewId }: CrewInvitesPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CrewInviteCandidate[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crewIdNumber = Number(crewId);
  const route = useMemo(() => `/crews/${crewId}/invites`, [crewId]);

  useEffect(() => {
    if (!Number.isFinite(crewIdNumber)) {
      setErrorMessage("잘못된 크루 경로입니다.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadInitial() {
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

        const response = await getCrewInviteCandidates(crewIdNumber);

        if (!isMounted) {
          return;
        }

        setItems(response);
        setIsLoading(false);
      } catch (error) {
        const operationalError = toOperationalError(error);
        const level =
          operationalError.code === "AUTH_ACCESS_DENIED" ||
          operationalError.code === "CREW_INVITE_NOT_ALLOWED"
            ? "warn"
            : "error";

        reportOperationalError("crew.invite_page_load_failed", operationalError, {
          level,
          route,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            operationalError,
            "직접 초대 화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void loadInitial();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, route, router]);

  async function handleSearch() {
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await getCrewInviteCandidates(crewIdNumber, query);
      setItems(response);
      setSelectedUserId((current) =>
        response.some((item) => item.userId === current) ? current : null,
      );
    } catch (error) {
      reportOperationalError("crew.invite_candidates_search_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "초대 가능한 회원을 다시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleInvite() {
    if (selectedUserId === null) {
      setErrorMessage("초대할 회원 1명을 먼저 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await createCrewInvite(crewIdNumber, selectedUserId);
      setSuccessMessage(`초대를 보냈습니다. 현재 상태는 ${response.status}입니다.`);
    } catch (error) {
      reportOperationalError("crew.invite_create_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "직접 초대 생성에 실패했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>직접 초대 화면을 불러오고 있습니다.</p>
      </main>
    );
  }

  const inviteSent = successMessage !== null;

  return (
    <main>
      <h1>직접 초대</h1>
      <p>Crew ID: {crewId}</p>
      <p>비공개 크루 리더만 회원을 직접 초대할 수 있습니다.</p>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}

      {!errorMessage || items.length > 0 ? (
        <>
          <label htmlFor="invite-candidate-search">검색어</label>
          <input
            id="invite-candidate-search"
            name="invite-candidate-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" disabled={isSearching || inviteSent} onClick={handleSearch}>
            검색
          </button>

          <ul>
            {items.map((item) => (
              <li key={item.userId}>
                <label>
                  <input
                    type="radio"
                    name="inviteCandidate"
                    aria-label={`${item.nickname} 선택`}
                    checked={selectedUserId === item.userId}
                    disabled={inviteSent}
                    onChange={() => setSelectedUserId(item.userId)}
                  />
                  {item.nickname}
                </label>
              </li>
            ))}
          </ul>

          <button type="button" disabled={inviteSent || isSubmitting} onClick={handleInvite}>
            {inviteSent ? "초대 보냄" : "초대 보내기"}
          </button>
        </>
      ) : null}
    </main>
  );
}
