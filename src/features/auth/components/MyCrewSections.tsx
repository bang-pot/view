import { MyCrewCard } from "@/features/auth/components/MyCrewCard";
import type { MyCrewListItem, PendingCrewListItem } from "@/shared/auth/types";

import styles from "./MyCrewsPageClient.module.css";

type SharedSectionProps = {
  readonly failedImageIds: readonly number[];
  readonly onImageError: (crewId: number) => void;
};

type PendingCrewSectionProps = SharedSectionProps & {
  readonly items: readonly PendingCrewListItem[];
  readonly hasNext: boolean;
  readonly isLoadingMore: boolean;
  readonly onLoadMore: () => void;
};

type ActiveCrewSectionProps = SharedSectionProps & {
  readonly items: readonly MyCrewListItem[];
  readonly hasNext: boolean;
  readonly isLoadingMore: boolean;
  readonly onLoadMore: () => void;
};

export function PendingCrewSection({
  items,
  hasNext,
  isLoadingMore,
  failedImageIds,
  onImageError,
  onLoadMore,
}: PendingCrewSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.crewSection} aria-labelledby="pending-crews-title">
      <h2 id="pending-crews-title" className={styles.sectionTitle}>
        가입 대기
      </h2>
      <ul className={styles.crewList} aria-label="가입 대기 크루 목록">
        {items.map((item) => (
          <li key={item.joinRequestId}>
            <MyCrewCard
              href={`/crews/public/${item.crewId}`}
              crewId={item.crewId}
              crewName={item.crewName}
              description={item.description}
              visibility={item.visibility}
              leaderNickname={item.leaderNickname}
              coverImageUrl={item.coverImageUrl}
              memberCount={item.memberCount}
              statusLabel="가입 대기"
              imageFailed={failedImageIds.includes(item.crewId)}
              onImageError={onImageError}
            />
          </li>
        ))}
      </ul>
      {hasNext ? (
        <div className={styles.loadMoreArea}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "더 불러오는 중..." : "가입 대기 더 보기"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function ActiveCrewSection({
  items,
  hasNext,
  isLoadingMore,
  failedImageIds,
  onImageError,
  onLoadMore,
}: ActiveCrewSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.crewSection} aria-labelledby="active-crews-title">
      <h2 id="active-crews-title" className={styles.sectionTitle}>
        소속 크루
      </h2>
      <ul className={styles.crewList} aria-label="소속 크루 목록">
        {items.map((item) => (
          <li key={item.crewId}>
            <MyCrewCard
              href={`/crews/${item.crewId}`}
              crewId={item.crewId}
              crewName={item.crewName}
              description={item.description}
              visibility={item.visibility}
              leaderNickname={item.leaderNickname}
              coverImageUrl={item.coverImageUrl}
              memberCount={item.memberCount}
              role={item.myRole}
              imageFailed={failedImageIds.includes(item.crewId)}
              onImageError={onImageError}
            />
          </li>
        ))}
      </ul>
      {hasNext ? (
        <div className={styles.loadMoreArea}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "더 불러오는 중..." : "소속 크루 더 보기"}
          </button>
        </div>
      ) : (
        <p className={styles.endMessage}>여기까지 모두 확인했어요.</p>
      )}
    </section>
  );
}
