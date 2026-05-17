"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import {
  checkNicknameAvailability,
  completeProfile,
  getMe,
} from "@/shared/auth/client";
import type { AuthMeResponse } from "@/shared/auth/types";
import {
  resolveCompletionDestination,
  sanitizeRedirectPath,
} from "@/shared/auth/guards";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

function resolveNicknameMessage(error: unknown): string | null {
  const fieldMessage = getFieldErrorMessage(error, "nickname");

  if (fieldMessage) {
    return fieldMessage;
  }

  const operationalError = toOperationalError(error);

  if (
    operationalError.code === "AUTH_DUPLICATE_NICKNAME" ||
    operationalError.code === "AUTH_INVALID_NICKNAME"
  ) {
    return operationalError.userMessage;
  }

  return null;
}

function isExpectedSubmissionError(code: string): boolean {
  return (
    code === "COMMON_VALIDATION_ERROR" ||
    code === "AUTH_DUPLICATE_NICKNAME" ||
    code === "AUTH_INVALID_NICKNAME" ||
    code === "AUTH_REQUIRED_TERMS_AGREEMENT"
  );
}

export function AuthCompletePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [agreedToRequiredTerms, setAgreedToRequiredTerms] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((currentUser) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveCompletionDestination(currentUser, requestedPath);
        if (destination) {
          router.replace(destination);
          return;
        }

        setMe(currentUser);
        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("auth.complete.bootstrap_failed", error, {
          route: "/auth/complete",
        });

        if (isMounted) {
          setErrorMessage(
            getUserMessage(
              error,
              "보완 상태를 확인하지 못했습니다. 다시 시도해 주세요.",
            ),
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestedPath, router]);

  async function handleNicknameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextNickname = event.target.value;
    setNickname(nextNickname);
    setNicknameMessage(null);

    if (!nextNickname.trim()) {
      return;
    }

    try {
      const result = await checkNicknameAvailability(nextNickname.trim());
      setNicknameMessage(
        result.available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.",
      );
    } catch (error) {
      reportOperationalError("auth.complete.nickname_check_failed", error, {
        level: "warn",
        route: "/auth/complete",
      });

      setNicknameMessage(
        resolveNicknameMessage(error) ??
          getUserMessage(
            error,
            "닉네임 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
          ),
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setNicknameMessage(null);
    setIsSubmitting(true);

    try {
      const result = await completeProfile({
        nickname: nickname.trim(),
        agreedToRequiredTerms,
      });
      router.replace(sanitizeRedirectPath(result.nextPath));
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("auth.complete.submit_failed", operationalError, {
        level: isExpectedSubmissionError(operationalError.code) ? "warn" : "error",
        route: "/auth/complete",
      });

      const fieldMessage = resolveNicknameMessage(operationalError);
      if (fieldMessage) {
        setNicknameMessage(fieldMessage);
      }

      setErrorMessage(
        fieldMessage && operationalError.code !== "AUTH_REQUIRED_TERMS_AGREEMENT"
          ? null
          : getUserMessage(
              operationalError,
              "가입 완료 처리에 실패했습니다. 입력값을 다시 확인해 주세요.",
            ),
      );
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>보완 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>신규 사용자 보완</h1>
      <p>
        닉네임을 정하고 필수 약관에 동의하면 Banglog full 사용자로 전환됩니다.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nickname">닉네임</label>
        <input id="nickname" name="nickname" value={nickname} onChange={handleNicknameChange} />
        {nicknameMessage ? <p>{nicknameMessage}</p> : null}

        <label>
          <input
            type="checkbox"
            checked={agreedToRequiredTerms}
            onChange={(event) => setAgreedToRequiredTerms(event.target.checked)}
          />
          필수 약관에 동의합니다.
        </label>

        {me ? <p>현재 약관 버전: {me.requiredTermsVersion}</p> : null}
        {errorMessage ? <p>{errorMessage}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          가입 완료
        </button>
      </form>
    </main>
  );
}
