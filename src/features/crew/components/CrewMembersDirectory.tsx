"use client";

import Image from "next/image";
import type { RefObject } from "react";

import type { CrewMember } from "@/shared/crew/types";

import styles from "./CrewPageClient.module.css";

type CrewMembersDirectoryProps = {
  members: CrewMember[];
  hasNext: boolean;
  isLoadingMore: boolean;
  loadMoreTargetRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
};

function formatJoinedAt(joinedAt: string): string {
  const parsed = new Date(joinedAt);

  if (Number.isNaN(parsed.getTime())) {
    return `${joinedAt} 가입`;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}.${month}.${day} 가입`;
}

function toRoleLabel(role: CrewMember["role"]): string {
  return role === "LEADER" ? "크루장" : "크루원";
}

function toGenderLabel(gender: string | null): string {
  if (!gender) {
    return "미설정";
  }

  if (gender === "MALE" || gender === "남") {
    return "남";
  }

  if (gender === "FEMALE" || gender === "여") {
    return "여";
  }

  return gender;
}

function toMemberMeta(member: CrewMember): string {
  return `${toGenderLabel(member.gender)} · ${member.escapeCount}방 · ${formatJoinedAt(member.joinedAt)}`;
}

function MemberAvatar({ member }: { member: CrewMember }) {
  if (member.profileImageUrl) {
    return (
      <Image
        src={member.profileImageUrl}
        alt={`${member.nickname} 프로필 이미지`}
        width={64}
        height={64}
        className={styles.memberAvatarImage}
      />
    );
  }

  return (
    <span
      className={styles.memberAvatarFallback}
      aria-label={`${member.nickname} 기본 프로필 이미지`}
    />
  );
}

export function CrewMembersDirectory({
  members,
  hasNext,
  isLoadingMore,
  loadMoreTargetRef,
  onLoadMore,
}: CrewMembersDirectoryProps) {
  return (
    <section className={styles.memberDirectoryPanel}>
      <header className={styles.memberDirectoryHeader}>
        <h1>크루원</h1>
        <span>총 {members.length}명</span>
      </header>

      {members.length === 0 ? (
        <p className={styles.memberEmpty}>아직 표시할 크루원이 없습니다.</p>
      ) : (
        <>
          <ul className={styles.memberDirectoryList} aria-label="크루원 목록">
            {members.map((member) => (
              <li key={member.userId} className={styles.memberDirectoryItem} data-member-role={member.role}>
                <MemberAvatar member={member} />
                <strong className={styles.memberName}>{member.nickname}</strong>
                <span className={styles.memberRoleBadge}>{toRoleLabel(member.role)}</span>
                <p className={styles.memberBio}>{member.bio ?? "한 줄 소개가 아직 없습니다."}</p>
                <p className={styles.memberMeta}>{toMemberMeta(member)}</p>
              </li>
            ))}
          </ul>
          {hasNext ? (
            <div ref={loadMoreTargetRef} className={styles.memberLoadGuide}>
              <span>{isLoadingMore ? "크루원을 더 불러오는 중입니다." : "스크롤하여 더 불러옵니다."}</span>
              {typeof IntersectionObserver === "undefined" ? (
                <button type="button" onClick={onLoadMore}>
                  더 보기
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
