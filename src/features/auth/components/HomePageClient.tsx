"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ExploreThemeCard } from "@/features/explore/components/ExploreThemeCard";
import { getHome } from "@/shared/auth/client";
import type {
  HomePublicCrewPreviewItem,
  HomeResponse,
  HomeThemeExplorePreviewItem,
  HomeUpcomingMeetingStatus,
} from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

type HomePageClientProps = {
  notice?: string | null;
};

function toCreateCrewHref(home: HomeResponse | null): string {
  if (home?.isLoggedIn) {
    return "/crews/new";
  }

  return "/login?redirectTo=%2Fcrews%2Fnew";
}

function toPublicCrewsHref(): string {
  return "/crews/public";
}

function toMeetingStatusLabel(status: HomeUpcomingMeetingStatus): string {
  if (status === "RECRUITMENT_CLOSED") {
    return "모집 마감";
  }

  return "모집 중";
}

type PreviewImageProps = {
  src: string | null;
  alt: string;
  fallbackLabel: string;
};

function PreviewImage({ src, alt, fallbackLabel }: PreviewImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          display: "grid",
          placeItems: "center",
          background: "#f4f4f5",
          color: "#5f5f67",
          borderRadius: 12,
          textAlign: "center",
          padding: 12,
        }}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      style={{
        width: "100%",
        aspectRatio: "4 / 3",
        objectFit: "cover",
        borderRadius: 12,
        display: "block",
      }}
    />
  );
}

function PublicCrewPreviewCard({ crew }: { crew: HomePublicCrewPreviewItem }) {
  return (
    <article
      style={{
        border: "1px solid #e4e4e7",
        borderRadius: 16,
        padding: 16,
        display: "grid",
        gap: 12,
        background: "#fff",
      }}
    >
      <PreviewImage
        src={crew.coverImageUrl}
        alt={`${crew.crewName} 크루 이미지`}
        fallbackLabel="크루 이미지 준비 중"
      />
      <div style={{ display: "grid", gap: 6 }}>
        <strong>{crew.crewName}</strong>
        <span>공개 크루</span>
        <span>멤버 {crew.memberCount}명</span>
      </div>
      <Link href={`/crews/public/${crew.crewId}`} aria-label={`${crew.crewName} 크루 보기`}>
        크루 보기
      </Link>
    </article>
  );
}

function ThemePreviewCard({ theme }: { theme: HomeThemeExplorePreviewItem }) {
  return (
    <ExploreThemeCard
      item={{
        themeId: theme.themeId,
        themeName: theme.themeName,
        storeName: theme.storeName,
        regionLabel: theme.regionName,
        posterImageUrl: theme.thumbnailUrl,
        favoriteCount: theme.favoriteCount,
        isFavorite: theme.isFavorite,
        runningTimeMinutes: null,
      }}
      redirectPath="/"
      variant="preview"
    />
  );
}

export function HomePageClient({ notice = null }: HomePageClientProps) {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createCrewHref = useMemo(() => toCreateCrewHref(home), [home]);
  const publicCrewsHref = useMemo(() => toPublicCrewsHref(), []);

  async function loadHome() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getHome();
      setHome(response);
    } catch (error) {
      reportOperationalError("auth.home.load_failed", error, {
        route: "/",
      });

      setHome(null);
      setErrorMessage(
        getUserMessage(error, "메인 홈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHome();
  }, []);

  if (isLoading) {
    return (
      <main>
        <p>메인 홈을 불러오는 중입니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={{ display: "grid", gap: 16 }}>
        <h1>BangPot</h1>
        <p>{errorMessage}</p>
        <button type="button" onClick={() => void loadHome()}>
          다시 시도
        </button>
      </main>
    );
  }

  if (!home) {
    return null;
  }

  return (
    <main style={{ display: "grid", gap: 32, padding: "24px 16px 48px" }}>
      <section style={{ display: "grid", gap: 16 }}>
        <h1>BangPot</h1>
        <p>방탈출 크루를 찾고, 모임을 만들고, 다음 약속까지 한 번에 이어보세요.</p>
        {notice === "crew-left" ? <p>크루를 탈퇴했어요.</p> : null}
        {notice === "crew-deleted" ? <p>크루를 해체했어요.</p> : null}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={publicCrewsHref}>공개 크루 탐색</Link>
          <Link href={createCrewHref}>크루 만들기</Link>
        </div>
      </section>

      {home.isLoggedIn ? (
        <>
          <section style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <h2>내 크루</h2>
                <p>
                  {home.myCrews.totalCount > 0
                    ? `현재 ${home.myCrews.totalCount}개의 크루를 확인하고 있어요.`
                    : "아직 소속된 크루가 없어요."}
                </p>
              </div>
              <Link href="/profile/crews">소속 크루 전체 보기</Link>
            </div>
            {home.myCrews.items.length > 0 ? (
              <ul style={{ display: "grid", gap: 12, padding: 0, margin: 0, listStyle: "none" }}>
                {home.myCrews.items.map((crew) => (
                  <li key={crew.crewId}>
                    <Link href={`/crews/${crew.crewId}`} aria-label={`${crew.crewName} 크루로 이동`}>
                      {crew.crewName}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>아직 소속된 크루가 없어요.</p>
            )}
          </section>

          <section style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <h2>다가오는 모임</h2>
                <p>
                  {home.upcomingMeetings.totalCount > 0
                    ? `곧 참여할 일정 ${home.upcomingMeetings.totalCount}개가 있어요.`
                    : "다가오는 모임이 없어요."}
                </p>
              </div>
              <Link href="/profile/joined-meetings">참여 모임 전체 보기</Link>
            </div>
            {home.upcomingMeetings.items.length > 0 ? (
              <ul style={{ display: "grid", gap: 12, padding: 0, margin: 0, listStyle: "none" }}>
                {home.upcomingMeetings.items.map((meeting) => (
                  <li
                    key={meeting.meetingId}
                    style={{
                      border: "1px solid #e4e4e7",
                      borderRadius: 16,
                      padding: 16,
                      display: "grid",
                      gap: 8,
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{meeting.title}</strong>
                      <span>{toMeetingStatusLabel(meeting.status)}</span>
                    </div>
                    <span>{meeting.crewName}</span>
                    <span>
                      {meeting.date} {meeting.time}
                    </span>
                    <Link
                      href={`/crews/${meeting.crewId}/meetings/${meeting.meetingId}`}
                      aria-label={`${meeting.title} 모임 보기`}
                    >
                      모임 보기
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>다가오는 모임이 없어요.</p>
            )}
          </section>
        </>
      ) : (
        <section style={{ display: "grid", gap: 8 }}>
          <h2>내 활동</h2>
          <p>로그인하면 내 크루와 다가오는 모임을 더 편하게 볼 수 있어요.</p>
          <Link href="/login">로그인</Link>
        </section>
      )}

      <section style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <h2>공개 크루 탐색</h2>
            <p>가볍게 둘러보고 마음에 드는 크루를 찾아보세요.</p>
          </div>
          <Link href="/crews/public">전체 보기</Link>
        </div>
        {home.publicCrewPreview.items.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {home.publicCrewPreview.items.map((crew) => (
              <PublicCrewPreviewCard key={crew.crewId} crew={crew} />
            ))}
          </div>
        ) : (
          <p>아직 공개 크루가 충분히 준비되지 않았어요.</p>
        )}
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <h2>방탈출 탐색</h2>
            <p>지금 바로 둘러볼 수 있는 테마 미리보기를 모아뒀어요.</p>
          </div>
          <Link href="/explore">전체 보기</Link>
        </div>
        {home.themeExplorePreview.items.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {home.themeExplorePreview.items.map((theme) => (
              <ThemePreviewCard key={theme.themeId} theme={theme} />
            ))}
          </div>
        ) : (
          <p>아직 탐색할 테마가 준비되지 않았어요.</p>
        )}
      </section>
    </main>
  );
}
