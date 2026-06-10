import Link from "next/link";

import type { AuthProfileHubResponse } from "@/shared/auth/types";

import styles from "./ProfilePageClient.module.css";

const ACTIVITY_LINKS = [
  {
    href: "/profile/joined-meetings",
    icon: "☘",
    label: "참여한 모임",
    countKey: "joinedMeetingsCount",
    periodLabel: "방탈출 기간",
  },
  {
    href: "/profile/created-meetings",
    icon: "✏",
    label: "만든 모임",
    countKey: "createdMeetingsCount",
    periodLabel: "모임 기간",
  },
  {
    href: "/profile/crews",
    icon: "♟",
    label: "소속 크루",
    countKey: "myCrewsCount",
    periodLabel: "현재 가입",
  },
] as const;

type ProfileActivitySummaryProps = {
  readonly profile: AuthProfileHubResponse;
};

export function ProfileActivitySummary({ profile }: ProfileActivitySummaryProps) {
  return (
    <section className={styles.panelCard} aria-label="활동 요약">
      <h2>활동 요약</h2>
      <div className={styles.activityGrid}>
        {ACTIVITY_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`${item.label} ${profile[item.countKey]} ${item.periodLabel} 상세 보기`}
            className={styles.activityCard}
          >
            <span className={styles.activityLabel}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </span>
            <strong>{profile[item.countKey]}</strong>
            <span>{item.periodLabel}</span>
            <span className={styles.underlined}>상세 보기</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
