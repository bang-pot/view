"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { logoutAndConfirmGuest } from "@/features/auth/logout";
import { getMe, getProfile, updateProfile } from "@/shared/auth/client";
import type { AuthProfileResponse } from "@/shared/auth/types";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PROFILE_PATH = "/profile";

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

function isExpectedProfileSaveError(code: string): boolean {
  return (
    code === "COMMON_VALIDATION_ERROR" ||
    code === "AUTH_DUPLICATE_NICKNAME" ||
    code === "AUTH_INVALID_NICKNAME" ||
    code === "AUTH_ACCESS_DENIED"
  );
}

export function ProfilePageClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthProfileResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((me) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, PROFILE_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        return getProfile().then((currentProfile) => {
          if (!isMounted) {
            return;
          }

          setProfile(currentProfile);
          setNickname(currentProfile.nickname);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        reportOperationalError("auth.profile.bootstrap_failed", error, {
          route: PROFILE_PATH,
        });

        if (isMounted) {
          setErrorMessage(
            getUserMessage(
              error,
              "프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
    setNicknameMessage(null);
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const nextProfile = await updateProfile({
        nickname: nickname.trim(),
      });

      setProfile(nextProfile);
      setNickname(nextProfile.nickname);
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("auth.profile.update_failed", operationalError, {
        level: isExpectedProfileSaveError(operationalError.code) ? "warn" : "error",
        route: PROFILE_PATH,
      });

      const fieldMessage = resolveNicknameMessage(operationalError);
      if (fieldMessage) {
        setNicknameMessage(fieldMessage);
      }

      setErrorMessage(
        fieldMessage
          ? null
          : getUserMessage(
              operationalError,
              "프로필 저장에 실패했습니다. 입력값을 다시 확인해 주세요.",
            ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    setNicknameMessage(null);
    setErrorMessage(null);
    setIsLoggingOut(true);

    try {
      const isGuest = await logoutAndConfirmGuest();

      if (isGuest) {
        router.replace("/login");
        return;
      }

      setErrorMessage("로그아웃 상태를 확인하지 못했습니다. 다시 시도해 주세요.");
    } catch (error) {
      reportOperationalError("auth.profile.logout_failed", error, {
        route: PROFILE_PATH,
      });

      setErrorMessage(
        getUserMessage(
          error,
          "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>프로필 정보를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Profile</h1>
      {profile ? (
        <>
          <p>User ID: {profile.id}</p>
          <p>Current nickname: {profile.nickname}</p>
          <Link href="/crew-invites">My invites</Link>
        </>
      ) : null}

      <form onSubmit={handleSubmit}>
        <label htmlFor="profile-nickname">Nickname</label>
        <input
          id="profile-nickname"
          name="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        {nicknameMessage ? <p>{nicknameMessage}</p> : null}
        {errorMessage ? <p>{errorMessage}</p> : null}

        <button type="submit" disabled={isSaving || isLoggingOut}>
          Save nickname
        </button>
      </form>

      <button type="button" onClick={handleLogout} disabled={isSaving || isLoggingOut}>
        Logout
      </button>
    </main>
  );
}
