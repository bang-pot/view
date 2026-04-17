"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { logoutAndConfirmGuest } from "@/features/auth/logout";
import { getMe, getProfile, updateProfile } from "@/shared/auth/client";
import type { AuthProfileHubResponse } from "@/shared/auth/types";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PROFILE_PATH = "/profile";

const ACTIVITY_LINKS = [
  {
    href: "/profile/created-meetings",
    label: "생성 모임",
    countKey: "createdMeetingsCount",
  },
  {
    href: "/profile/joined-meetings",
    label: "참여 모임",
    countKey: "joinedMeetingsCount",
  },
  {
    href: "/profile/my-crews",
    label: "소속 크루",
    countKey: "myCrewsCount",
  },
  {
    href: "/profile/pending-crews",
    label: "가입 대기",
    countKey: "pendingCrewsCount",
  },
] as const;

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
  const [profile, setProfile] = useState<AuthProfileHubResponse | null>(null);
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
          setErrorMessage(null);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        reportOperationalError("auth.profile.bootstrap_failed", error, {
          route: PROFILE_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "프로필 허브를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
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

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              nickname: nextProfile.nickname,
              profileImageUrl: nextProfile.profileImageUrl,
            }
          : currentProfile,
      );
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
              "프로필 저장에 실패했어요. 입력값을 다시 확인해 주세요.",
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

      setErrorMessage("로그아웃 상태를 확인하지 못했어요. 다시 시도해 주세요.");
    } catch (error) {
      reportOperationalError("auth.profile.logout_failed", error, {
        route: PROFILE_PATH,
      });

      setErrorMessage(
        getUserMessage(error, "로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>프로필 허브를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main>
        <h1>내 프로필</h1>
        <p>{errorMessage ?? "프로필 허브를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1>내 프로필</h1>

      <section
        aria-label="프로필 기본 정보"
        style={{
          display: "grid",
          gap: 16,
          padding: 20,
          border: "1px solid #d9d9d9",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "#f5f5f5",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {profile.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profileImageUrl}
              alt={`${profile.nickname} 프로필 이미지`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>프로필 이미지 준비 중</span>
          )}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 24 }}>{profile.nickname}</strong>
          <span>내 활동을 한 화면에서 확인하고 바로 이어서 들어갈 수 있어요.</span>
        </div>
      </section>

      <section aria-label="활동 허브" style={{ display: "grid", gap: 12 }}>
        <h2>내 활동</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {ACTIVITY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "grid",
                gap: 8,
                padding: 16,
                border: "1px solid #d9d9d9",
                borderRadius: 16,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <strong>
                {item.label} {profile[item.countKey]}
              </strong>
              <span>상세 목록 보기</span>
            </Link>
          ))}
        </div>
      </section>

      <section
        aria-label="프로필 수정"
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          border: "1px solid #d9d9d9",
          borderRadius: 16,
        }}
      >
        <h2>닉네임 수정</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label htmlFor="profile-nickname">닉네임</label>
          <input
            id="profile-nickname"
            name="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
          {nicknameMessage ? <p>{nicknameMessage}</p> : null}
          {errorMessage ? <p>{errorMessage}</p> : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" disabled={isSaving || isLoggingOut}>
              닉네임 저장
            </button>
            <button type="button" onClick={handleLogout} disabled={isSaving || isLoggingOut}>
              로그아웃
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
