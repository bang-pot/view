"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ThemeFavoriteButton } from "@/features/explore/components/ThemeFavoriteButton";
import { getHome } from "@/shared/auth/client";
import type {
  HomePublicCrewPreviewItem,
  HomeResponse,
  HomeThemeExplorePreviewItem,
} from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { IconButton } from "@/shared/ui/IconButton";
import type { IconName } from "@/shared/ui/Icon";

import styles from "./HomePageClient.module.css";

type HomePageClientProps = {
  notice?: string | null;
};

const FEATURE_CARDS = [
  {
    icon: "crew",
    title: "나와 딱 맞는 크루 찾기!",
    description: "나와 딱 맞는 크루에 가입하거나 크루를 만들어 방탈출을 즐겨보세요.",
  },
  {
    icon: "calendar",
    title: "약속 잡기 쉽게!",
    description: "성향과 스케줄에 맞는 크루를 찾아드려요.",
  },
  {
    icon: "log",
    title: "방탈출 추억 남기기!",
    description: "성향과 스케줄에 맞는 크루를 찾아드려요.",
  },
] satisfies ReadonlyArray<{
  description: string;
  icon: IconName;
  title: string;
}>;

const THEME_POSTER_TAGS = ["드라마", "공포", "추리", "SF"] as const;
const THEME_TRACK_CARD_WIDTH = 240;
const THEME_FEATURED_CARD_WIDTH = 300;

type ThemePosterTag = (typeof THEME_POSTER_TAGS)[number];

function toThemePosterTag(index: number): ThemePosterTag {
  return THEME_POSTER_TAGS[index % THEME_POSTER_TAGS.length];
}

function toThemePosterToneClass(index: number): string {
  if (index % 4 === 1) {
    return styles.themePosterToneHorror;
  }

  if (index % 4 === 2) {
    return styles.themePosterToneMystery;
  }

  if (index % 4 === 3) {
    return styles.themePosterToneSf;
  }

  return styles.themePosterToneNavy;
}

function toCreateCrewHref(home: HomeResponse | null): string {
  if (home?.isLoggedIn) {
    return "/crews/new";
  }

  return "/login?redirectTo=%2Fcrews%2Fnew";
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
        <Link href="/" aria-label="Banglog 홈" className={styles.logoLink}>
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
          <h1
            aria-label={isLoggedIn ? undefined : "우리의 탈출이 기록되는 LOG, BANGLOG"}
            className={isLoggedIn ? undefined : styles.heroGuestTitle}
          >
            {isLoggedIn ? (
              "오늘도 방탈출하러 가볼까요?"
            ) : (
              <>
                <span className={styles.heroTitleLine}>우리의 탈출이 기록되는 LOG,</span>
                <span className={styles.heroBrandLine}>BANGLOG</span>
              </>
            )}
          </h1>
          {isLoggedIn ? (
            <p>
              {home.upcomingMeetings.totalCount > 0
                ? `예정된 활동이 ${home.upcomingMeetings.totalCount}개 있어요. 확인해보세요.`
                : "오늘 함께할 크루와 새로운 방탈출 일정을 찾아보세요."}
            </p>
          ) : null}
          {notice === "crew-left" ? <p className={styles.notice}>크루를 탈퇴했어요.</p> : null}
          {notice === "crew-deleted" ? <p className={styles.notice}>크루를 해체했어요.</p> : null}
          <div className={styles.heroActions}>
            {isLoggedIn ? (
              <Button href="/profile" size="md" variant="primary" className={styles.homeActionButton}>
                활동 확인하기
              </Button>
            ) : (
              <>
                <Button
                  href="/login"
                  size="md"
                  variant="primary"
                  className={`${styles.homeActionButton} ${styles.kakaoActionButton}`}
                >
                  카카오로 시작하기
                </Button>
                <Button href="/crews/public" size="md" variant="ghost" className={styles.homeActionButton}>
                  크루 둘러보기
                </Button>
              </>
            )}
            {isLoggedIn ? null : (
              <Link href={createCrewHref} className={styles.visuallyHidden}>
                크루 만들기
              </Link>
            )}
          </div>
        </div>
        <div className={styles.heroVisual}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home/main_illust.svg"
            alt="방로그 히어로 일러스트"
            className={styles.heroIllustration}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className={`${styles.section} ${styles.featureSection}`}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionTitleBlock}>
          <h2>방로그와 함께라면</h2>
          <p>방로그에서는 이런 활동을 할 수 있어요</p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURE_CARDS.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <span className={styles.featureNumber} aria-hidden="true" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <Icon name={feature.icon} decorative className={styles.featureCardIcon} />
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
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <article className={styles.activityCard}>
      <Icon name={icon} decorative className={styles.activityIcon} />
      <span className={styles.activityLabel}>{label}</span>
      <strong>{value}</strong>
      <span className={styles.activityCaption}>{caption}</span>
    </article>
  );
}

function ActivitySection({ home }: { home: HomeResponse }) {
  const nearestMeeting = home.upcomingMeetings.nearestMeeting;

  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <h2>나의 활동</h2>
        <div className={styles.activityGrid}>
          <ActivityCard
            icon="crew"
            label="내 크루"
            value={`${home.myCrews.totalCount}개`}
            caption={
              home.myCrews.items[0] ? `${home.myCrews.items[0].crewName} 외` : "새 크루를 찾아보세요"
            }
          />
          <ActivityCard
            icon="calendar"
            label="예정된 활동"
            value={`${home.upcomingMeetings.totalCount}개`}
            caption={
              nearestMeeting
                ? `${nearestMeeting.themeName} · ${nearestMeeting.date} ${nearestMeeting.time}`
                : "예정된 일정이 없어요"
            }
          />
          <ActivityCard
            icon="log"
            label="활동 기록"
            value={`${home.activityRecord.completedCount}회`}
            caption={`성공률 ${home.activityRecord.successRate}%`}
          />
        </div>
      </div>
    </section>
  );
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
              {home.myCrews.items.map((crew) => (
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
                  <span className={styles.nextMeetingText}>크루 홈에서 활동 확인</span>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>아직 소속된 크루가 없어요.</p>
          )}
          <div className={styles.crewFindPanel}>
            <Button href="/crews/public" size="md" variant="ghost" className={styles.homeActionButton}>
              크루 찾기
            </Button>
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
          <Button
            href="/crews/public"
            size="md"
            variant="ghost"
            className={`${styles.sectionButton} ${styles.headerMoreButton}`}
            rightIcon={<span className={styles.buttonSquareIcon} aria-hidden="true" />}
          >
            크루 더 보기
          </Button>
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
      </div>
    </section>
  );
}

function ThemePreviewCard({
  isActive,
  index,
  theme,
}: {
  isActive: boolean;
  index: number;
  theme: HomeThemeExplorePreviewItem;
}) {
  const tag = toThemePosterTag(index);

  return (
    <article
      className={`${styles.themeRankCard} ${isActive ? styles.themeRankCardActive : ""}`}
      aria-current={isActive ? "true" : undefined}
    >
      <div className={`${styles.themePoster} ${toThemePosterToneClass(index)}`}>
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
              className={styles.themePosterImage}
            />
          ) : (
            <span className={styles.themePosterFallback}>포스터 준비 중</span>
          )}
          <span className={styles.themePosterNoise} aria-hidden="true" />
          <span className={styles.themePosterCopy}>
            <span className={styles.themePosterKicker}>{tag}</span>
            <strong className={styles.themePosterTitle}>{theme.themeName}</strong>
            <span className={styles.themePosterStore}>{theme.storeName}</span>
          </span>
          <span className={styles.themeRankNumber} aria-hidden="true">
            {index + 1}
          </span>
        </Link>
        <div className={styles.themeFavorite}>
          <ThemeFavoriteButton
            themeId={theme.themeId}
            initialIsFavorite={theme.isFavorite}
            initialFavoriteCount={theme.favoriteCount}
            redirectPath="/"
            variant="compact"
          />
        </div>
      </div>
      <div className={styles.themeInfo}>
        <div>
          <strong>{theme.themeName}</strong>
          <span className={styles.themeGenreTag}>{tag}</span>
        </div>
        <span className={styles.themeInfoMeta}>
          <span aria-label={`찜 ${theme.favoriteCount.toLocaleString()}`}>
            <span aria-hidden="true">♡</span>
            <span>{theme.favoriteCount.toLocaleString()}</span>
          </span>
          <span>◆ {theme.storeName}</span>
        </span>
      </div>
    </article>
  );
}

function ThemeExploreSection({ items }: { items: HomeThemeExplorePreviewItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = Math.max(items.length - 1, 0);
  const safeActiveIndex = Math.min(activeIndex, maxIndex);

  const goPrevious = () => {
    setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goNext = () => {
    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, maxIndex));
  };

  return (
    <section className={`${styles.section} ${styles.themeExploreSection}`}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>이번 주 인기 방탈출</h2>
            <p>좋아요 수 기준 · 본격 탐색은 방탈출 Explore에서</p>
          </div>
          <div className={styles.sectionHeaderActions}>
            <Button
              href="/explore"
              size="md"
              variant="ghost"
              className={styles.sectionButton}
              rightIcon={<span className={styles.buttonSquareIcon} aria-hidden="true" />}
            >
              방탈출 탐색
            </Button>
          </div>
        </div>
        {items.length > 0 ? (
          <div className={styles.themeRanking}>
            <IconButton
              type="button"
              size="md"
              variant="outline"
              aria-label="이전 인기 방탈출"
              className={`${styles.themeNavButton} ${styles.themeNavButtonLeft}`}
              onClick={goPrevious}
              disabled={safeActiveIndex === 0}
            >
              <Icon name="left" decorative />
            </IconButton>
            <div className={styles.themeViewport}>
              <div
                className={styles.themeTrack}
                style={{
                  transform: `translateX(calc(50% - ${
                    THEME_FEATURED_CARD_WIDTH / 2
                  }px - ${safeActiveIndex * THEME_TRACK_CARD_WIDTH}px))`,
                }}
              >
                {items.map((theme, index) => (
                  <ThemePreviewCard
                    key={theme.themeId}
                    theme={theme}
                    index={index}
                    isActive={index === safeActiveIndex}
                  />
                ))}
              </div>
            </div>
            <IconButton
              type="button"
              size="md"
              variant="outline"
              aria-label="다음 인기 방탈출"
              className={`${styles.themeNavButton} ${styles.themeNavButtonRight}`}
              onClick={goNext}
              disabled={safeActiveIndex === maxIndex}
            >
              <Icon name="right" decorative />
            </IconButton>
            <div className={styles.themeDots} aria-label="인기 방탈출 순위 선택">
              {items.map((theme, index) => (
                <button
                  key={theme.themeId}
                  type="button"
                  aria-label={`${index + 1}위로 이동`}
                  aria-current={index === safeActiveIndex ? "true" : undefined}
                  className={`${styles.themeDot} ${
                    index === safeActiveIndex ? styles.themeDotActive : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.emptyText}>아직 탐색할 테마가 준비되지 않았어요.</p>
        )}
      </div>
    </section>
  );
}

function GuestStickyCta() {
  return (
    <aside className={styles.guestStickyCta} aria-label="비로그인 시작 안내">
      <span>크루 탐색, 일정 등록, 기록까지</span>
      <strong>로그인하면 바로 시작</strong>
      <Button href="/login" size="sm" variant="primary" className={styles.guestStickyButton}>
        카카오로 시작
      </Button>
    </aside>
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
        <small>© 2026 Banglog. All rights reserved.</small>
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
        <Button
          type="button"
          onClick={() => void loadHome()}
          size="md"
          variant="ghost"
          className={styles.homeActionButton}
        >
          다시 시도
        </Button>
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
      {home.isLoggedIn ? null : <GuestStickyCta />}
    </div>
  );
}
