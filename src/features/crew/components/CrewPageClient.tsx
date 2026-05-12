"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse, CrewVisibility } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { TextButton } from "@/shared/ui/TextButton";

import styles from "./CrewPageClient.module.css";

type CrewPageClientProps = {
  crewId: string;
};

export type CrewWorkspaceMenuKey =
  | "plaza"
  | "policies"
  | "members"
  | "schedule"
  | "meetings"
  | "gallery"
  | "logs";

type MenuItem = {
  key: CrewWorkspaceMenuKey;
  label: string;
  href: string;
};

type CrewWorkspaceShellProps = {
  activeMenu: CrewWorkspaceMenuKey;
  children: ReactNode;
  crew: CrewHubResponse;
  crewId: string;
};

type CrewWorkspaceStatePageProps = {
  children: ReactNode;
  title?: string;
};

const MEMBER_COUNT_PLACEHOLDER = 5;

const shoutMessages = [
  "오늘도 화이팅!",
  "강남역 7시 만나요",
  "방탈 고고고",
  "라이브서 너무 웃었음",
  "추리 최고",
  "모두 와요!",
  "새로운 방 추천!",
  "다음 방 뭐 갈까?",
  "예약 완료",
  "이제 리뷰 남겨야지",
  "오늘 단서 미쳤다",
  "힌트 없이 클리어",
  "안전 탈출!",
  "방탈 마스터",
  "퍼즐 감각 최고",
  "신입 환영합니다",
  "정답!",
];

const weeklySchedules = [
  { date: "5월 6일", title: "방탈출 정기 모임" },
  { date: "5월 8일", title: "신입 환영회" },
  { date: "5월 10일", title: "정기 공모" },
];

const recentLogs = [
  {
    title: "홍대에서 진행한 방탈출",
    body: "홍대에서 진행한 방탈출이었는데 진짜 너무 재미있었고 다음에도 같이 가고 싶어요.",
    hasImages: true,
    tone: "blue",
  },
  {
    title: "이번 주 크루 기록",
    body: "마지막 문제를 다 같이 풀어내서 더 기억에 남는 하루였어요.",
    hasImages: false,
    tone: "white",
  },
  {
    title: "새로운 매장 탐방",
    body: "처음 가본 매장이었지만 동선도 좋고 모두 만족스러운 하루였습니다.",
    hasImages: true,
    tone: "blue",
  },
];

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function isLeader(role: string): boolean {
  return role === "LEADER";
}

function toRoleLabel(role: string): string {
  return isLeader(role) ? "크루장" : "크루원";
}

function toVisibilityLabel(visibility: CrewVisibility): string {
  return visibility === "PUBLIC" ? "공개" : "비공개";
}

function SquareIcon() {
  return <span className={styles.squareIcon} aria-hidden="true" />;
}

function LeaderAvatar() {
  return (
    <span className={styles.leaderAvatar} aria-hidden="true">
      화
    </span>
  );
}

export function CrewWorkspaceStatePage({ children, title }: CrewWorkspaceStatePageProps) {
  return (
    <main className={styles.statePage}>
      {title ? <h1>{title}</h1> : null}
      {children}
    </main>
  );
}

export function createCrewWorkspaceFallback(crewId: string, name = "크루"): CrewHubResponse {
  return {
    crewId: Number(crewId),
    name,
    description: "함께 방탈출을 즐기는 크루입니다.",
    visibility: "PUBLIC",
    imageUrl: null,
    myRole: "MEMBER",
    hasNotice: false,
    pendingJoinRequestCount: 0,
  };
}

export function CrewWorkspaceShell({ activeMenu, children, crew, crewId }: CrewWorkspaceShellProps) {
  const leader = isLeader(crew.myRole);
  const meetingsPath = `/crews/${crewId}/meetings`;
  const schedulePath = `/crews/${crewId}/schedule`;
  const logsPath = `/crews/${crewId}/logs`;
  const galleryPath = `/crews/${crewId}/gallery`;
  const policiesPath = `/crews/${crewId}/policies`;
  const membersPath = `/crews/${crewId}/members`;
  const settingsPath = `/crews/${crewId}/settings`;
  const manageJoinRequestsPath = `/crews/${crewId}/join-requests`;
  const menuItems: MenuItem[] = [
    { key: "plaza", label: "광장", href: `/crews/${crewId}` },
    { key: "policies", label: "정책", href: policiesPath },
    { key: "members", label: "크루원", href: membersPath },
    { key: "schedule", label: "방장 일정", href: schedulePath },
    { key: "meetings", label: "방탈 모집", href: meetingsPath },
    { key: "gallery", label: "사진첩", href: galleryPath },
    { key: "logs", label: "방탈로그", href: logsPath },
  ];

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href="/">홈</Link>
        <span aria-hidden="true"> &gt; </span>
        <Link href="/crews/public">크루탐색</Link>
        <span aria-hidden="true"> &gt; </span>
        <span>{crew.name}</span>
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.summaryCard} aria-label="크루 요약">
            <div className={styles.cover}>
              {crew.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={crew.imageUrl} alt={`${crew.name} 대표 이미지`} />
              ) : null}
            </div>
            <div className={styles.summaryBody}>
              <h1>{crew.name}</h1>
              <p>{crew.description ?? "함께 방탈출을 즐기는 크루입니다."}</p>
              <dl className={styles.metaList}>
                <div>
                  <dt>크루장</dt>
                  <dd className={styles.leaderPill}>
                    <LeaderAvatar />
                    <span>닉네임</span>
                  </dd>
                </div>
                <div>
                  <dt>총 인원</dt>
                  <dd>{MEMBER_COUNT_PLACEHOLDER}명</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd className={styles.visibilityPill}>{toVisibilityLabel(crew.visibility)}</dd>
                </div>
              </dl>
              <span className={styles.visuallyHidden}>{toRoleLabel(crew.myRole)}</span>
              {leader ? (
                <Button href={settingsPath} variant="ghost" size="sm" className={styles.manageButton}>
                  크루 관리 설정
                </Button>
              ) : null}
            </div>
          </section>

          <nav className={styles.crewNav} aria-label="크루 내부 메뉴">
            {menuItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.key === activeMenu ? "page" : undefined}
                className={item.key === activeMenu ? styles.activeMenu : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          <section className={styles.alertStack} aria-label={leader ? "관리 알림" : "크루 알림"}>
            {leader ? (
              <div className={styles.alertBar}>
                <Chip size="sm" variant="solid" className={styles.blueChip}>
                  가입신청
                </Chip>
                <p>새로운 가입 신청 {crew.pendingJoinRequestCount ?? 0}건이 대기 중입니다.</p>
                <Button href={manageJoinRequestsPath} size="sm" className={styles.alertAction}>
                  신청자 보기
                </Button>
                <SquareIcon />
              </div>
            ) : null}
            <div className={styles.alertBar}>
              <Chip size="sm" variant="solid" className={styles.yellowChip}>
                공지사항
              </Chip>
              <p>크루원에게 공유할 공지를 확인해 주세요.</p>
            </div>
          </section>

          {children}
        </div>
      </div>
    </main>
  );
}

function CrewDashboardContent({ crewId }: { crewId: string }) {
  const logsPath = `/crews/${crewId}/logs`;

  return (
    <>
      <section className={styles.shoutBox} aria-labelledby="crew-shout-heading">
        <div className={styles.panelHeader}>
          <h2 id="crew-shout-heading">오늘의 한마디</h2>
        </div>
        <div className={styles.shoutCloud} aria-label="크루 한마디 목록">
          {shoutMessages.map((message, index) => (
            <span
              key={`${message}-${index}`}
              className={`${styles.shoutBubble} ${styles[`bubbleTone${(index % 6) + 1}`]}`}
            >
              {message}
            </span>
          ))}
        </div>
        <label className={styles.shoutInputLabel}>
          <span className={styles.visuallyHidden}>오늘의 한마디 입력</span>
          <input placeholder="한마디 남길 메시지를 입력하세요" />
          <span aria-hidden="true">✎</span>
        </label>
      </section>

      <section className={styles.schedulePanel} aria-labelledby="weekly-schedule-heading">
        <div className={styles.panelHeader}>
          <h2 id="weekly-schedule-heading">주간 일정</h2>
          <TextButton leftIcon={<SquareIcon />} size="sm" variant="primary">
            Text Button
          </TextButton>
        </div>
        <ul>
          {weeklySchedules.map((schedule) => (
            <li key={`${schedule.date}-${schedule.title}`}>
              <span>{schedule.date}</span>
              <strong>{schedule.title}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.logPanel} aria-labelledby="recent-logs-heading">
        <div className={styles.panelHeader}>
          <h2 id="recent-logs-heading">최근 방탈로그</h2>
          <Link href={logsPath}>전체 보기 -&gt;</Link>
        </div>
        <ul>
          {recentLogs.map((log) => (
            <li key={log.title}>
              <article className={`${styles.logCard} ${log.hasImages ? "" : styles.textOnlyLogCard}`}>
                {log.hasImages ? (
                  <div className={`${styles.logThumb} ${log.tone === "blue" ? styles.logThumbBlue : ""}`}>
                    <span>+2장</span>
                  </div>
                ) : null}
                <div>
                  <h3>{log.title}</h3>
                  <p>{log.body}</p>
                  <span>[공포] 서울 이스케이프룸 · 1시간 전</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function CrewPageClient({ crewId }: CrewPageClientProps) {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;

    void getCrewHub(crewIdNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCrew(response);
        setIsLoading(false);
      })
      .catch((error) => {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("crew.hub_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: `/crews/${crewId}`,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "크루 홈을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, crewIdNumber, hasValidCrewId, publicCrewPath, router]);

  if (!hasValidCrewId) {
    return (
      <CrewWorkspaceStatePage title="크루 홈">
        <p>올바르지 않은 크루 경로입니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (isLoading) {
    return (
      <CrewWorkspaceStatePage>
        <p>크루 홈을 불러오고 있습니다.</p>
      </CrewWorkspaceStatePage>
    );
  }

  if (!crew) {
    return (
      <CrewWorkspaceStatePage title="크루 홈">
        <p>{errorMessage ?? "크루 홈을 불러오지 못했어요."}</p>
      </CrewWorkspaceStatePage>
    );
  }

  return (
    <CrewWorkspaceShell activeMenu="plaza" crew={crew} crewId={crewId}>
      <CrewDashboardContent crewId={crewId} />
    </CrewWorkspaceShell>
  );
}
