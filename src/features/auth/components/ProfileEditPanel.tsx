import type { FormEvent } from "react";
import { useState } from "react";

import styles from "./ProfilePageClient.module.css";

type ProfileEditPanelProps = {
  readonly nickname: string;
  readonly profileImageUrl: string | null;
  readonly nicknameMessage: string | null;
  readonly errorMessage: string | null;
  readonly isSaving: boolean;
  readonly onNicknameChange: (value: string) => void;
  readonly onProfileImageChange: (file: File | null) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onClose: () => void;
};

export function ProfileEditPanel({
  nickname,
  profileImageUrl,
  nicknameMessage,
  errorMessage,
  isSaving,
  onNicknameChange,
  onProfileImageChange,
  onSubmit,
  onClose,
}: ProfileEditPanelProps) {
  const [bio, setBio] = useState("");

  return (
    <div className={styles.profileEditOverlay} role="presentation">
      <section
        className={styles.profileEditDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <h2 id="profile-edit-title" className={styles.visuallyHidden}>
          프로필 수정
        </h2>
        <button
          type="button"
          className={styles.profileEditCloseButton}
          onClick={onClose}
          aria-label="프로필 수정 닫기"
        >
          ×
        </button>

        <form onSubmit={onSubmit} className={styles.profileEditForm}>
          <div className={styles.profileImageEditor}>
            <div className={styles.profileEditAvatar}>
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUrl} alt="프로필 미리보기" />
              ) : (
                <span aria-hidden="true">📷</span>
              )}
            </div>
            <label className={styles.profileImageSelectButton} htmlFor="profile-image">
              사진 선택
            </label>
            <input
              id="profile-image"
              name="profileImage"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              aria-label="Profile image"
              className={styles.profileImageFileInput}
              onChange={(event) => onProfileImageChange(event.currentTarget.files?.[0] ?? null)}
            />
          </div>

          <div className={styles.profileEditField}>
            <label htmlFor="profile-nickname">닉네임</label>
            <input
              id="profile-nickname"
              name="nickname"
              value={nickname}
              placeholder="닉네임을 입력해주세요"
              onChange={(event) => onNicknameChange(event.target.value)}
            />
            {nicknameMessage ? <p className={styles.errorText}>{nicknameMessage}</p> : null}
          </div>

          <div className={styles.profileEditField}>
            <label htmlFor="profile-bio">한줄소개</label>
            <div className={styles.profileTextareaShell}>
              <textarea
                id="profile-bio"
                name="bio"
                maxLength={200}
                value={bio}
                placeholder="한줄소개를 입력해주세요"
                onChange={(event) => setBio(event.target.value)}
              />
              <span>{bio.length} / 200</span>
            </div>
          </div>

          <div className={styles.profileEditTwoColumn}>
            <div className={styles.profileEditField}>
              <label htmlFor="profile-escape-count">방수</label>
              <input
                id="profile-escape-count"
                name="escapeCount"
                inputMode="numeric"
                placeholder="0"
              />
              <p className={styles.profileEditHint}>0-2000까지 입력가능</p>
            </div>

            <div className={styles.profileEditField}>
              <label htmlFor="profile-gender">성별</label>
              <select id="profile-gender" name="gender" defaultValue="">
                <option value="" disabled>
                  선택하세요
                </option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
                <option value="NONE">선택 안 함</option>
              </select>
            </div>
          </div>

          {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

          <button type="submit" className={styles.profileEditSubmitButton} disabled={isSaving}>
            저장
          </button>
        </form>
      </section>
    </div>
  );
}
