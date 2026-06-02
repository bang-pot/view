"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getCrewHub } from "@/shared/crew/client";
import type { CrewHubResponse } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getCrewLogFeed } from "@/shared/log/client";
import type { CrewLogFeedItem } from "@/shared/log/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";
import {
  createCrewWorkspaceFallback,
  CrewWorkspaceShell,
} from "@/features/crew/components/CrewPageClient";
import crewWorkspaceStyles from "@/features/crew/components/CrewPageClient.module.css";

type CrewLogFeedPageClientProps = {
  crewId: string;
};

const PAGE_SIZE = 20;

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function buildCrewLogDetailPath(crewId: string, logId: number): string {
  return `/crews/${crewId}/logs/${logId}`;
}

function mergeItems(
  previousItems: CrewLogFeedItem[],
  nextItems: CrewLogFeedItem[],
): CrewLogFeedItem[] {
  const seen = new Set(previousItems.map((item) => item.logId));
  const merged = [...previousItems];

  for (const item of nextItems) {
    if (!seen.has(item.logId)) {
      merged.push(item);
      seen.add(item.logId);
    }
  }

  return merged;
}

function getExcerpt(excerpt: string): string {
  return excerpt.trim() || "후기 요약이 아직 없습니다.";
}

function getFeedExcerpt(item: CrewLogFeedItem): string {
  return `[${item.themeName}] ${getExcerpt(item.excerpt)}`;
}

function toResultLabel(result: CrewLogFeedItem["result"]): string {
  if (result === "SUCCESS") {
    return "성공";
  }
  if (result === "FAILURE") {
    return "실패";
  }
  return "결과 대기";
}

function toFeedMeta(item: CrewLogFeedItem): string {
  return `[${item.meetingTitle}] · ${toResultLabel(item.result)} · ${item.meetingDate}`;
}

function LogPlaceholderGrid() {
  return (
    <ul className={crewWorkspaceStyles.placeholderGrid} aria-label="방탈로그 미리보기">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={`log-placeholder-${index + 1}`}>
          <article className={crewWorkspaceStyles.placeholderCard}>
            <div className={crewWorkspaceStyles.placeholderImage}>기록 준비 중</div>
            <div className={crewWorkspaceStyles.placeholderMeta}>
              <strong>방탈로그 {index + 1}</strong>
              <span>크루 기록이 등록되면 이곳에 보여요.</span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

function LogFeedHeader({ crewId }: { crewId: string }) {
  return (
    <header className={crewWorkspaceStyles.logFeedHeader}>
      <h1>방탈로그</h1>
      <Button
        href={`/crews/${crewId}/meetings`}
        size="sm"
        variant="primary"
        className={crewWorkspaceStyles.logWriteButton}
        leftIcon={<span className={crewWorkspaceStyles.squareIcon} aria-hidden="true" />}
      >
        로그 작성하기
      </Button>
    </header>
  );
}

export function CrewLogFeedPageClient({ crewId }: CrewLogFeedPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [crew, setCrew] = useState<CrewHubResponse | null>(null);
  const [items, setItems] = useState<CrewLogFeedItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const crewIdNumber = Number(crewId);
  const hasValidCrewId = Number.isFinite(crewIdNumber);
  const routePath = `/crews/${crewId}/logs`;
  const publicCrewPath = buildPublicCrewPath(crewId);
  const notice = searchParams.get("notice");
  const noticeMessage =
    notice === "deleted-own-log" || notice === "deleted-crew-log"
      ? "방탈로그를 삭제했어요."
      : null;

  useEffect(() => {
    if (!hasValidCrewId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsLoadingMore(false);
    setErrorMessage(null);

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, routePath);

        if (destination) {
          router.replace(destination);
          return;
        }

        const [crewResult, feedResult] = await Promise.allSettled([
          getCrewHub(crewIdNumber),
          getCrewLogFeed(crewIdNumber, {
            page: 0,
            size: PAGE_SIZE,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        if (crewResult.status === "fulfilled") {
          setCrew(crewResult.value);
        }

        if (feedResult.status !== "fulfilled") {
          throw feedResult.reason;
        }

        const response = feedResult.value;
        setItems(response.items);
        setPage(response.pageInfo.page);
        setHasNext(response.pageInfo.hasNext);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) && error.code === "AUTH_ACCESS_DENIED";

        reportOperationalError("crew.log_feed.bootstrap_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidCrewId, publicCrewPath, routePath, router]);

  async function handleLoadMore() {
    setIsLoadingMore(true);

    try {
      const response = await getCrewLogFeed(crewIdNumber, {
        page: page + 1,
        size: PAGE_SIZE,
      });

      setItems((currentItems) => mergeItems(currentItems, response.items));
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
      setErrorMessage(null);
    } catch (error) {
      reportOperationalError("crew.log_feed.load_more_failed", error, {
        level: "warn",
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(error, "크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasValidCrewId) {
    return (
      <main>
        <h1>크루 방탈로그</h1>
        <p>올바른 크루 경로가 아닙니다.</p>
      </main>
    );
  }

  const resolvedCrew = crew ?? createCrewWorkspaceFallback(crewId);

  if (isLoading) {
    return (
      <CrewWorkspaceShell activeMenu="logs" crew={resolvedCrew} crewId={crewId}>
        <section className={`${crewWorkspaceStyles.tabPanel} ${crewWorkspaceStyles.logFeedPanel}`}>
          <LogFeedHeader crewId={crewId} />
          <p>크루 방탈로그 피드를 불러오는 중입니다.</p>
        </section>
      </CrewWorkspaceShell>
    );
  }

  return (
    <CrewWorkspaceShell activeMenu="logs" crew={resolvedCrew} crewId={crewId}>
      <section className={`${crewWorkspaceStyles.tabPanel} ${crewWorkspaceStyles.logFeedPanel}`}>
      <LogFeedHeader crewId={crewId} />

      {noticeMessage ? <p>{noticeMessage}</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {!errorMessage && items.length === 0 ? (
        <>
          <p>아직 등록된 방탈로그가 없어요.</p>
          <LogPlaceholderGrid />
        </>
      ) : null}

      {!errorMessage && items.length > 0 ? (
        <>
          <ul
            aria-label="크루 방탈로그 피드"
            className={crewWorkspaceStyles.crewLogFeedList}
          >
            {items.map((item) => (
              <li key={item.logId}>
                <Link
                  href={buildCrewLogDetailPath(crewId, item.logId)}
                  className={crewWorkspaceStyles.crewLogFeedCard}
                  data-has-cover={item.coverPhotoUrl ? "true" : "false"}
                  data-result={item.result}
                >
                  {item.coverPhotoUrl ? (
                    <div className={crewWorkspaceStyles.crewLogCover}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.coverPhotoUrl}
                        alt={`${item.meetingTitle} 대표 사진`}
                      />
                      {item.extraPhotoCount > 0 ? (
                        <span>+{item.extraPhotoCount}장</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={crewWorkspaceStyles.crewLogContent}>
                    <p>{getFeedExcerpt(item)}</p>
                    <div className={crewWorkspaceStyles.crewLogFooter}>
                      <span className={crewWorkspaceStyles.crewLogAuthor}>
                        <span aria-hidden="true">{item.authorNickname.slice(0, 1)}</span>
                        <strong>{item.authorNickname}</strong>
                      </span>
                      <span className={crewWorkspaceStyles.crewLogMeta}>{toFeedMeta(item)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {hasNext ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              style={{ marginTop: 20 }}
            >
              {isLoadingMore ? "더 불러오는 중..." : "더 보기"}
            </button>
          ) : (
            <p>여기까지 모두 읽었어요.</p>
          )}
        </>
      ) : null}
      </section>
    </CrewWorkspaceShell>
  );
}
