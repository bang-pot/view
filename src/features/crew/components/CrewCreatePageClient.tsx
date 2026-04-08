"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import { createCrew } from "@/shared/crew/client";
import type { CrewVisibility } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

const CREW_CREATE_PATH = "/crews/new";

function resolveNameMessage(error: unknown): string | null {
  const fieldMessage = getFieldErrorMessage(error, "name");

  if (fieldMessage) {
    return fieldMessage;
  }

  const operationalError = toOperationalError(error);

  if (operationalError.code === "CREW_DUPLICATE_NAME") {
    return operationalError.userMessage;
  }

  return null;
}

function resolveVisibilityMessage(error: unknown): string | null {
  return getFieldErrorMessage(error, "visibility");
}

function isExpectedCreateError(code: string): boolean {
  return (
    code === "COMMON_VALIDATION_ERROR" ||
    code === "CREW_DUPLICATE_NAME" ||
    code === "AUTH_UNAUTHENTICATED" ||
    code === "AUTH_ACCESS_DENIED"
  );
}

export function CrewCreatePageClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<CrewVisibility>("PUBLIC");
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [visibilityMessage, setVisibilityMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((me) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, CREW_CREATE_PATH);

        if (destination) {
          router.replace(destination);
          return;
        }

        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("crew.create.bootstrap_failed", error, {
          route: CREW_CREATE_PATH,
        });

        if (isMounted) {
          setErrorMessage(
            getUserMessage(
              error,
              "크루 생성 화면을 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ),
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameMessage(null);
    setVisibilityMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const createdCrew = await createCrew({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        visibility,
        imageUrl: null,
      });

      router.push(`/crews/${createdCrew.crewId}`);
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("crew.create.submit_failed", operationalError, {
        level: isExpectedCreateError(operationalError.code) ? "warn" : "error",
        route: CREW_CREATE_PATH,
      });

      const nextNameMessage = resolveNameMessage(operationalError);
      const nextVisibilityMessage = resolveVisibilityMessage(operationalError);

      if (nextNameMessage) {
        setNameMessage(nextNameMessage);
      }

      if (nextVisibilityMessage) {
        setVisibilityMessage(nextVisibilityMessage);
      }

      setErrorMessage(
        nextNameMessage || nextVisibilityMessage
          ? null
          : getUserMessage(
              operationalError,
              "크루 생성에 실패했습니다. 입력값을 다시 확인해 주세요.",
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>크루 생성 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Create crew</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="crew-name">Name</label>
        <input
          id="crew-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {nameMessage ? <p>{nameMessage}</p> : null}

        <label htmlFor="crew-description">Description</label>
        <textarea
          id="crew-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <fieldset>
          <legend>Visibility</legend>
          <label htmlFor="crew-visibility-public">
            <input
              id="crew-visibility-public"
              type="radio"
              name="visibility"
              value="PUBLIC"
              checked={visibility === "PUBLIC"}
              onChange={() => setVisibility("PUBLIC")}
            />
            Public
          </label>
          <label htmlFor="crew-visibility-private">
            <input
              id="crew-visibility-private"
              type="radio"
              name="visibility"
              value="PRIVATE"
              checked={visibility === "PRIVATE"}
              onChange={() => setVisibility("PRIVATE")}
            />
            Private
          </label>
        </fieldset>
        {visibilityMessage ? <p>{visibilityMessage}</p> : null}

        {errorMessage ? <p>{errorMessage}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          Create crew
        </button>
      </form>
    </main>
  );
}
