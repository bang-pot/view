"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { toCompletionPath } from "@/shared/auth/guards";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import {
  createCrewJoinRequest,
  getPublicCrewJoinView,
} from "@/shared/crew/client";
import type { CrewJoinStatus, CrewJoinViewResponse } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type PublicCrewJoinPageClientProps = {
  crewId: number;
};

function buildPublicCrewPath(crewId: number): string {
  return `/crews/public/${crewId}`;
}

function isExpectedJoinRequestError(code: string): boolean {
  return (
    code === "COMMON_VALIDATION_ERROR" ||
    code === "AUTH_UNAUTHENTICATED" ||
    code === "AUTH_ACCESS_DENIED" ||
    code === "CREW_JOIN_REQUEST_NOT_ALLOWED" ||
    code === "CREW_ALREADY_JOINED" ||
    code === "CREW_JOIN_REQUEST_ALREADY_PENDING"
  );
}

export function PublicCrewJoinPageClient({ crewId }: PublicCrewJoinPageClientProps) {
  const [crew, setCrew] = useState<CrewJoinViewResponse | null>(null);
  const [myStatus, setMyStatus] = useState<CrewJoinStatus | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    let isMounted = true;

    void getPublicCrewJoinView(crewId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCrew(response);
        setMyStatus(response.myStatus);
        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("crew.public.join_view_failed", error, {
          route: publicCrewPath,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "공개 크루 소개를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, publicCrewPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessageError(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await createCrewJoinRequest(crewId, {
        message: message.trim() ? message.trim() : null,
      });

      setMyStatus(response.myStatus);
      setIsSuccessModalOpen(true);
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("crew.public.join_request_failed", operationalError, {
        level: isExpectedJoinRequestError(operationalError.code) ? "warn" : "error",
        route: publicCrewPath,
      });

      const nextMessageError = getFieldErrorMessage(operationalError, "message");

      if (nextMessageError) {
        setMessageError(nextMessageError);
      }

      setErrorMessage(
        nextMessageError
          ? null
          : getUserMessage(
              operationalError,
              "가입 신청에 실패했습니다. 잠시 뒤 다시 시도해 주세요.",
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>공개 크루 소개를 불러오고 있습니다.</p>
      </main>
    );
  }

  if (!crew) {
    return (
      <main>
        <h1>Public crew</h1>
        <p>{errorMessage ?? "공개 크루 소개를 불러오지 못했습니다."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{crew.name}</h1>
      <p>{crew.description ?? "소개가 아직 없습니다."}</p>
      <p>Visibility: {crew.visibility}</p>

      {myStatus === "GUEST" ? (
        <Link href={`/login?redirectTo=${encodeURIComponent(publicCrewPath)}`}>
          로그인 후 가입 신청
        </Link>
      ) : null}

      {myStatus === "COMPLETION_REQUIRED" ? (
        <Link href={toCompletionPath(publicCrewPath)}>가입 완료 후 신청</Link>
      ) : null}

      {myStatus === "CAN_REQUEST" ? (
        <form onSubmit={handleSubmit}>
          <label htmlFor="crew-join-message">Join request message</label>
          <textarea
            id="crew-join-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {messageError ? <p>{messageError}</p> : null}
          {errorMessage ? <p>{errorMessage}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            가입 신청
          </button>
        </form>
      ) : null}

      {myStatus === "PENDING" ? (
        <button type="button" disabled>
          승인 대기 중
        </button>
      ) : null}

      {myStatus === "MEMBER" ? (
        <Link href={`/crews/${crew.crewId}`}>크루 페이지로 이동</Link>
      ) : null}

      {myStatus === "PRIVATE_RESTRICTED" ? (
        <>
          <button type="button" disabled>
            가입 신청 불가
          </button>
          <p>비공개 크루는 직접 가입 신청할 수 없습니다.</p>
        </>
      ) : null}

      {isSuccessModalOpen ? (
        <div role="dialog" aria-modal="true" aria-label="가입 신청 완료">
          <h2>가입 신청 완료</h2>
          <p>크루 가입 신청을 보냈습니다. 승인 결과를 기다려 주세요.</p>
          <button type="button" onClick={() => setIsSuccessModalOpen(false)}>
            확인
          </button>
        </div>
      ) : null}
    </main>
  );
}
