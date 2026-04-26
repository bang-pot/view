"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ThemeFavoriteButton } from "@/features/explore/components/ThemeFavoriteButton";
import { getHome } from "@/shared/auth/client";
import type {
  HomePublicCrewPreviewItem,
  HomeResponse,
  HomeThemeExplorePreviewItem,
  HomeUpcomingMeetingPreviewItem,
  HomeUpcomingMeetingStatus,
} from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { BrandLogo } from "@/shared/ui/BrandLogo";

import styles from "./HomePageClient.module.css";

type HomePageClientProps = {
  notice?: string | null;
};

const FEATURE_CARDS = [
  {
    icon: "🧩",
    title: "크루 매칭",
    description: "성향과 스케줄에 맞는 크루를 찾아드려요.",
  },
  {
    icon: "📅",
    title: "활동 관리",
    description: "예정된 방탈출 일정을 한눈에 확인하세요.",
  },
  {
    icon: "📊",
    title: "기록 & 통계",
    description: "탈출 기록과 성공률을 자동으로 분석해요.",
  },
] as const;

const THEME_CARD_TONES = ["ink", "purple", "navy", "green", "blue", "red"] as const;

function toCreateCrewHref(home: HomeResponse | null): string {
  if (home?.isLoggedIn) {
    return "/crews/new";
  }

  return "/login?redirectTo=%2Fcrews%2Fnew";
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
  className?: string;
};

function PreviewImage({ src, alt, fallbackLabel, className }: PreviewImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <div className={className ?? styles.previewFallback}>{fallbackLabel}</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setHasError(true)} className={className} />
  );
}

function HomeHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="BangPot 홈" className={styles.logoLink}>
          <BrandLogo className={styles.headerLogo} />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/" aria-current="page">
            홈
          </Link>
          <Link href="/crews/public">크루 탐색</Link>
          <Link href="/explore">방탈출 탐색</Link>
        </nav>
        <div className={styles.headerActions} aria-label="사용자 메뉴">
          <span className={styles.notificationIcon} aria-label="알림" role="img">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path d="M18 16.5h-12l1.5-2v-3.5a4.5 4.5 0 0 1 9 0v3.5l1.5 2Z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <Link href="/login" aria-label="로그인" className={styles.avatarLink}>
            A
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection({
  home,
  createCrewHref,
  notice,
}: {
  home: HomeResponse;
  createCrewHref: string;
  notice: string | null;
}) {
  const isLoggedIn = home.isLoggedIn;

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          {isLoggedIn ? <p className={styles.heroGreeting}>안녕하세요, 탈출왕님 👋</p> : null}
          <h1>
            {isLoggedIn
              ? "오늘도 방탈출하러 가볼까요?"
              : "하루 한 끝, 나의 탈출 함께할 사람과 함께."}
          </h1>
          <p>
            {isLoggedIn
              ? home.upcomingMeetings.totalCount > 0
                ? `예정된 활동이 ${home.upcomingMeetings.totalCount}개 있어요. 확인해보세요.`
                : "오늘 함께할 크루와 새로운 방탈출 일정을 찾아보세요."
              : "방탈출 좋아하는 사람들의 크루 매칭 플랫폼 같이 할 크루를 찾아보세요."}
          </p>
          {notice === "crew-left" ? <p className={styles.notice}>크루를 탈퇴했어요.</p> : null}
          {notice === "crew-deleted" ? <p className={styles.notice}>크루를 해체했어요.</p> : null}
          <div className={styles.heroActions}>
            {isLoggedIn ? (
              <Link href="/profile" className={styles.darkAction}>
                활동 확인하기
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.primaryAction}>
                  카카오로 시작하기
                </Link>
                <Link href="/crews/public" className={styles.secondaryAction}>
                  크루 둘러보기
                </Link>
              </>
            )}
            {isLoggedIn ? null : (
              <Link href={createCrewHref} className={styles.visuallyHidden}>
                크루 만들기
              </Link>
            )}
          </div>
        </div>
        <div className={styles.heroOrb} aria-hidden="true" />
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <h2>방팟과 함께라면</h2>
        <div className={styles.featureGrid}>
          {FEATURE_CARDS.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <span className={styles.featureIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivityCard({
  caption,
  icon,
  label,
  value,
}: {
  caption: string;
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <article className={styles.activityCard}>
      <span className={styles.featureIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.activityLabel}>{label}</span>
      <strong>{value}</strong>
      <span className={styles.activityCaption}>{caption}</span>
    </article>
  );
}

function ActivitySection({ home }: { home: HomeResponse }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <h2>나의 활동</h2>
        <div className={styles.activityGrid}>
          <ActivityCard
            icon="👥"
            label="내 크루"
            value={`${home.myCrews.totalCount}개`}
            caption={
              home.myCrews.items[0] ? `${home.myCrews.items[0].crewName} 외` : "새 크루를 찾아보세요"
            }
          />
          <ActivityCard
            icon="📅"
            label="예정된 활동"
            value={`${home.upcomingMeetings.totalCount}개`}
            caption={
              home.upcomingMeetings.items[0]
                ? `${home.upcomingMeetings.items[0].date} ${home.upcomingMeetings.items[0].time}`
                : "예정된 일정이 없어요"
            }
          />
          <ActivityCard
            icon="📊"
            label="둘러볼 테마"
            value={`${home.themeExplorePreview.items.length}개`}
            caption="이번 주 인기 테마"
          />
        </div>
      </div>
    </section>
  );
}

function findNextMeeting(
  crewId: number,
  meetings: HomeUpcomingMeetingPreviewItem[],
): HomeUpcomingMeetingPreviewItem | null {
  return meetings.find((meeting) => meeting.crewId === crewId) ?? null;
}

function MyCrewSection({ home }: { home: HomeResponse }) {
  return (
    <section className={styles.previewSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>내 크루</h2>
          </div>
        </div>
        <div className={styles.myCrewLayout}>
          {home.myCrews.items.length > 0 ? (
            <div className={styles.ownedCrewGrid}>
              {home.myCrews.items.map((crew) => {
                const nextMeeting = findNextMeeting(crew.crewId, home.upcomingMeetings.items);

                return (
                  <article
                    key={crew.crewId}
                    className={styles.ownedCrewCard}
                  >
                    <span className={styles.ownedCrewImage}>
                      <span className={styles.crewAvatar}>A</span>
                    </span>
                    <Link
                      href={`/crews/${crew.crewId}`}
                      aria-label={`${crew.crewName} 크루로 이동`}
                      className={styles.ownedCrewName}
                    >
                      {crew.crewName}
                    </Link>
                    <span className={styles.crewMeta}>활동 중인 크루</span>
                    <span className={styles.crewBadge}>크루</span>
                    {nextMeeting ? (
                      <Link
                        href={`/crews/${nextMeeting.crewId}/meetings/${nextMeeting.meetingId}`}
                        aria-label={`${nextMeeting.title} 다음 활동 보기`}
                        className={styles.nextMeetingLink}
                        >
                          {toMeetingStatusLabel(nextMeeting.status)} · {nextMeeting.title}
                        </Link>
                    ) : (
                      <span className={styles.nextMeetingText}>다음 활동 없음</span>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyText}>아직 소속된 크루가 없어요.</p>
          )}
          <div className={styles.crewFindPanel}>
            <Link href="/crews/public" className={styles.moreLink}>
              크루 찾기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicCrewPreviewCard({ crew }: { crew: HomePublicCrewPreviewItem }) {
  return (
    <Link
      href={`/crews/public/${crew.crewId}`}
      aria-label={`${crew.crewName} 크루 보기`}
      className={styles.crewCard}
    >
      <PreviewImage
        src={crew.coverImageUrl}
        alt={`${crew.crewName} 크루 이미지`}
        fallbackLabel="이미지 준비 중"
        className={styles.crewImage}
      />
      <span className={styles.crewName}>{crew.crewName}</span>
      <span className={styles.crewMeta}>공개 모집 중</span>
      <span className={styles.crewMeta}>멤버 {crew.memberCount}명</span>
      <span className={styles.crewBadge}>모집</span>
    </Link>
  );
}

function PublicCrewSection({
  description,
  items,
  title,
}: {
  description: string;
  items: HomePublicCrewPreviewItem[];
  title: string;
}) {
  return (
    <section className={styles.previewSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        {items.length > 0 ? (
          <div className={styles.crewGrid}>
            {items.map((crew) => (
              <PublicCrewPreviewCard key={crew.crewId} crew={crew} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>아직 공개 크루가 충분히 준비되지 않았어요.</p>
        )}
        <div className={styles.centerAction}>
          <Link href="/crews/public" className={styles.moreLink}>
            크루 더 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

function ThemePreviewCard({
  index,
  theme,
}: {
  index: number;
  theme: HomeThemeExplorePreviewItem;
}) {
  const tone = THEME_CARD_TONES[index % THEME_CARD_TONES.length];

  return (
    <article className={`${styles.themeCard} ${styles[`themeTone${tone}`]}`}>
      <span className={styles.rankBadge}>{index + 1}</span>
      <div className={styles.themeFavorite}>
        <ThemeFavoriteButton
          themeId={theme.themeId}
          initialIsFavorite={theme.isFavorite}
          initialFavoriteCount={theme.favoriteCount}
          redirectPath="/"
          variant="compact"
        />
      </div>
      <Link
        href={`/explore/themes/${theme.themeId}`}
        aria-label={`${theme.themeName} 상세 보기`}
        className={styles.themeLink}
      >
        {theme.thumbnailUrl ? (
          <PreviewImage
            src={theme.thumbnailUrl}
            alt={`${theme.themeName} 포스터`}
            fallbackLabel=""
            className={styles.themeImage}
          />
        ) : (
          <span className={styles.themePosterFallback}>포스터 준비 중</span>
        )}
        <span className={styles.themeInfo}>
          <strong>{theme.themeName}</strong>
          <span>{theme.storeName}</span>
          <span>{theme.regionName}</span>
        </span>
      </Link>
    </article>
  );
}

function ThemeExploreSection({ items }: { items: HomeThemeExplorePreviewItem[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>이번 주 인기 테마</h2>
            <p>요즘 크루들이 많이 살펴본 방탈출 테마예요.</p>
          </div>
          <Link href="/explore" className={styles.inlineLink}>
            전체 보기
          </Link>
        </div>
        {items.length > 0 ? (
          <div className={styles.themeGrid}>
            {items.map((theme, index) => (
              <ThemePreviewCard key={theme.themeId} theme={theme} index={index} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>아직 탐색할 테마가 준비되지 않았어요.</p>
        )}
      </div>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <BrandLogo className={styles.footerLogo} decorative />
        <p>방탈출 좋아하는 사람들의 크루 매칭 플랫폼</p>
        <nav className={styles.footerLinks} aria-label="푸터 메뉴">
          <Link href="/">서비스 소개</Link>
          <Link href="/">이용약관</Link>
          <Link href="/">개인정보처리방침</Link>
          <Link href="/">문의하기</Link>
        </nav>
        <small>© 2026 BangPot. All rights reserved.</small>
      </div>
    </footer>
  );
}

export function HomePageClient({ notice = null }: HomePageClientProps) {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createCrewHref = useMemo(() => toCreateCrewHref(home), [home]);

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
      <main className={styles.statePage}>
        <p>메인 홈을 불러오는 중입니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className={styles.statePage}>
        <BrandLogo className={styles.stateLogo} />
        <p>{errorMessage}</p>
        <button type="button" onClick={() => void loadHome()} className={styles.retryButton}>
          다시 시도
        </button>
      </main>
    );
  }

  if (!home) {
    return null;
  }

  return (
    <div className={styles.page}>
      <HomeHeader />
      <main className={styles.main}>
        <HeroSection home={home} createCrewHref={createCrewHref} notice={notice} />
        {home.isLoggedIn ? (
          <>
            <ActivitySection home={home} />
            <MyCrewSection home={home} />
          </>
        ) : (
          <FeatureSection />
        )}
        <PublicCrewSection
          items={home.publicCrewPreview.items}
          title={home.isLoggedIn ? "다른 크루도 둘러보세요" : "지금 모집 중인 크루"}
          description={
            home.isLoggedIn
              ? "내 크루 밖의 새로운 방탈출 친구들도 만나보세요."
              : "취향이 맞는 크루를 찾아보세요."
          }
        />
        <ThemeExploreSection items={home.themeExplorePreview.items} />
      </main>
      <HomeFooter />
    </div>
  );
}
