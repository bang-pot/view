import Link from "next/link";

import type { MyCrewRole, MyCrewVisibility } from "@/shared/auth/types";

import styles from "./MyCrewCard.module.css";

type MyCrewCardProps = {
  readonly href: string;
  readonly crewId: number;
  readonly crewName: string;
  readonly description: string | null;
  readonly visibility: MyCrewVisibility;
  readonly leaderNickname: string;
  readonly coverImageUrl: string | null;
  readonly memberCount: number | null | undefined;
  readonly role?: MyCrewRole;
  readonly statusLabel?: string;
  readonly imageFailed: boolean;
  readonly onImageError: (crewId: number) => void;
};

function toVisibilityLabel(visibility: MyCrewVisibility): string {
  switch (visibility) {
    case "PUBLIC":
      return "공개 크루";
    case "PRIVATE":
      return "비공개 크루";
  }
}

function toRoleLabel(role: MyCrewRole | undefined): string | null {
  switch (role) {
    case "LEADER":
      return "크루장";
    case "MEMBER":
      return "크루원";
    case undefined:
      return null;
  }
}

export function MyCrewCard({
  href,
  crewId,
  crewName,
  description,
  visibility,
  leaderNickname,
  coverImageUrl,
  memberCount,
  role,
  statusLabel,
  imageFailed,
  onImageError,
}: MyCrewCardProps) {
  const roleLabel = toRoleLabel(role);
  const shouldShowImage = coverImageUrl !== null && !imageFailed;
  const memberCountLabel =
    typeof memberCount === "number" && Number.isFinite(memberCount) ? `${memberCount}명` : "인원 확인 중";

  return (
    <Link href={href} className={styles.card}>
      <span className={styles.cover} aria-hidden={shouldShowImage ? undefined : "true"}>
        {shouldShowImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={`${crewName} 대표 이미지`}
            onError={() => onImageError(crewId)}
          />
        ) : null}
      </span>
      <span className={styles.content}>
        {statusLabel ? <span className={styles.status}>{statusLabel}</span> : null}
        <strong className={styles.name}>{crewName}</strong>
        <span className={styles.metaRow}>
          <span className={`${styles.pill} ${styles.dot}`}>{toVisibilityLabel(visibility)}</span>
          <span className={`${styles.pill} ${styles.dot}`}>{memberCountLabel}</span>
          <span className={styles.pill}>방장 {leaderNickname}</span>
          {roleLabel ? <span className={styles.pill}>{roleLabel}</span> : null}
        </span>
        <span className={styles.description}>{description?.trim() || "아직 소개글이 없어요."}</span>
      </span>
    </Link>
  );
}
