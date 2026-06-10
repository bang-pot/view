"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { ProfileActivitySummary } from "@/features/auth/components/ProfileActivitySummary";
import { ProfileCalendarSection } from "@/features/auth/components/ProfileCalendarSection";
import { ProfileEditPanel } from "@/features/auth/components/ProfileEditPanel";
import { ProfileFavoriteThemesSummarySection } from "@/features/auth/components/ProfileFavoriteThemesSummarySection";
import { ProfileMeetingLogsSummarySection } from "@/features/auth/components/ProfileMeetingLogsSummarySection";
import { ProfileTopHeader } from "@/features/auth/components/ProfileTopHeader";
import { getMe, getProfile, updateProfile } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { AuthProfileHubResponse } from "@/shared/auth/types";
import {
  getFieldErrorMessage,
  getUserMessage,
  toOperationalError,
} from "@/shared/errors/operational";
import { uploadProfileImage } from "@/shared/image/client";
import { reportOperationalError } from "@/shared/monitoring/operations";

import styles from "./ProfilePageClient.module.css";

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

function getProfileInitial(nickname: string): string {
  return nickname.trim().charAt(0).toUpperCase() || "A";
}

export function ProfilePageClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthProfileHubResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [nicknameMessage, setNicknameMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      const uploadedProfileImage = profileImageFile
        ? await uploadProfileImage(profileImageFile)
        : null;
      const nextProfile = await updateProfile(
        uploadedProfileImage === null
          ? { nickname: nickname.trim() }
          : {
              nickname: nickname.trim(),
              profileImageUploadId: uploadedProfileImage.uploadId,
            },
      );

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
      setProfileImageFile(null);
      setIsEditing(false);
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("auth.profile.update_failed", operationalError, {
        level: isExpectedProfileSaveError(operationalError.code) ? "warn" : "error",
        route: PROFILE_PATH,
      });

      const fieldMessage = resolveNicknameMessage(operationalError);
      setNicknameMessage(fieldMessage);
      setErrorMessage(
        fieldMessage
          ? null
          : getUserMessage(
              operationalError,
              "프로필 수정에 실패했어요. 입력값을 다시 확인해 주세요.",
            ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <ProfileTopHeader />
        <main className={styles.pageShell}>
          <p className={styles.stateText}>프로필 허브를 불러오는 중입니다.</p>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <ProfileTopHeader />
        <main className={styles.pageShell}>
          <h1>마이페이지</h1>
          <p className={styles.stateText}>
            {errorMessage ?? "프로필 허브를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <ProfileTopHeader />
      <main className={styles.pageShell}>
      <h1 className={styles.visuallyHidden}>마이페이지</h1>

      <section className={styles.profileCard} aria-label="프로필 기본 정보">
        <div className={styles.avatarLarge} aria-label="프로필 이미지 없음">
          {profile.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profileImageUrl} alt={`${profile.nickname} 프로필 이미지`} />
          ) : (
            <span>{getProfileInitial(profile.nickname)}</span>
          )}
        </div>

        <div className={styles.profileCopy}>
          <strong className={styles.nickname}>{profile.nickname}</strong>
          <span className={styles.profileMeta}>
            방탈출 기록 {profile.joinedMeetingsCount + profile.createdMeetingsCount}방
          </span>
          <p>방탈출을 사랑하는 Banglog 크루원</p>
        </div>

        <div className={styles.profileActions}>
          <button type="button" className={styles.primaryButton} onClick={() => setIsEditing(true)}>
            프로필 수정
          </button>
          <Link href="/profile/withdrawal" className={styles.secondaryButton}>
            계정관리
          </Link>
        </div>
      </section>

      {isEditing ? (
        <ProfileEditPanel
          nickname={nickname}
          profileImageUrl={profile.profileImageUrl}
          nicknameMessage={nicknameMessage}
          errorMessage={errorMessage}
          isSaving={isSaving}
          onNicknameChange={setNickname}
          onProfileImageChange={setProfileImageFile}
          onSubmit={handleSubmit}
          onClose={() => setIsEditing(false)}
        />
      ) : null}

        <ProfileActivitySummary profile={profile} />
        <ProfileCalendarSection />
        <ProfileMeetingLogsSummarySection authorName={profile.nickname} />
        <ProfileFavoriteThemesSummarySection />
      </main>
    </>
  );
}
