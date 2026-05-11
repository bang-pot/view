"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { getExploreCrews } from "@/shared/crew/client";
import {
  EXPLORE_CREW_SORT_LABELS,
  type ExploreCrewCard,
  type ExploreCrewSort,
} from "@/shared/crew/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { IconButton } from "@/shared/ui/IconButton";
import { Textarea } from "@/shared/ui/Textarea";

import styles from "./PublicCrewsPageClient.module.css";

const CREW_EXPLORE_PATH = "/crews/public";
const PAGE_SIZE = 6;
const SORT_OPTIONS = Object.entries(EXPLORE_CREW_SORT_LABELS) as Array<
  [ExploreCrewSort, string]
>;

function mergeCrews(current: ExploreCrewCard[], next: ExploreCrewCard[]): ExploreCrewCard[] {
  const crewsById = new Map<number, ExploreCrewCard>();

  for (const crew of current) {
    crewsById.set(crew.crewId, crew);
  }

  for (const crew of next) {
    crewsById.set(crew.crewId, crew);
  }

  return Array.from(crewsById.values());
}

function getVisibilityLabel(visibility: ExploreCrewCard["visibility"]): string {
  return visibility === "PUBLIC" ? "공개" : "비공개";
}

function buildQuery(keyword: string, sort: ExploreCrewSort, page: number) {
  const trimmedKeyword = keyword.trim();

  return {
    page,
    size: PAGE_SIZE,
    ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
    sort,
  };
}

function CrewExploreHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="BangPot 홈" className={styles.logoLink}>
          <BrandLogo className={styles.logo} />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/">홈</Link>
          <Link href={CREW_EXPLORE_PATH} aria-current="page">
            크루 탐색
          </Link>
          <Link href="/explore">방탈출 탐색</Link>
        </nav>
        <div className={styles.headerActions} aria-label="사용자 메뉴">
          <span className={styles.notification} aria-hidden="true" />
          <Link href="/profile" className={styles.avatarLink} aria-label="마이페이지">
            A
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicCrewsPageClient() {
  const [crews, setCrews] = useState<ExploreCrewCard[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<ExploreCrewCard | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoinCompleteModalOpen, setIsJoinCompleteModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ExploreCrewSort>("LATEST");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async (nextPage: number, mode: "replace" | "append") => {
    const requestId = ++requestIdRef.current;

    if (mode === "append") {
      setIsLoadingMore(true);
      setLoadMoreErrorMessage(null);
    } else {
      setIsInitialLoading(true);
      setErrorMessage(null);
      setLoadMoreErrorMessage(null);
      setHasNext(false);
    }

    try {
      const response = await getExploreCrews(buildQuery(keyword, sort, nextPage));

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setCrews((current) =>
        mode === "append" ? mergeCrews(current, response.items) : response.items,
      );
      setPage(response.pageInfo.page);
      setHasNext(response.pageInfo.hasNext);
    } catch (error) {
      reportOperationalError("crew.explore.list_failed", error, {
        route: CREW_EXPLORE_PATH,
      });

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      const userMessage = getUserMessage(
        error,
        "크루 탐색 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );

      if (mode === "append") {
        setLoadMoreErrorMessage(userMessage);
        return;
      }

      setErrorMessage(userMessage);
      setCrews([]);
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      if (mode === "append") {
        setIsLoadingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, [keyword, sort]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadPage(0, "replace");

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPage]);

  useEffect(() => {
    if (!selectedCrew) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCrew(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCrew]);

  useEffect(() => {
    if (!selectedCrew) {
      setIsJoinModalOpen(false);
      setIsJoinCompleteModalOpen(false);
      setJoinMessage("");
    }
  }, [selectedCrew]);

  const hasKeyword = keyword.trim().length > 0;
  const shouldShowEmptyState = !errorMessage && !isInitialLoading && crews.length === 0;

  return (
    <div className={styles.page}>
      <CrewExploreHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1>크루 탐색</h1>
              <p>나와 딱 맞는 방탈출 모임 찾기</p>
              <label className={styles.searchLabel}>
                <span className={styles.visuallyHidden}>크루 검색</span>
                <input
                  type="search"
                  value={keyword}
                  placeholder="크루명, 크루장 이름 검색"
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <span className={styles.searchIcon} aria-hidden="true" />
              </label>
            </div>
            <div className={styles.heroCircle} aria-hidden="true" />
          </div>
        </section>

        <section className={styles.listSection} aria-labelledby="crew-list-heading">
          <div className={styles.listHeader}>
            <h2 id="crew-list-heading">전체 크루 ({crews.length})</h2>
            <label className={styles.sortLabel}>
              <span className={styles.visuallyHidden}>정렬</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as ExploreCrewSort)}
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isInitialLoading ? (
            <p className={styles.stateText}>크루 탐색 목록을 불러오고 있습니다.</p>
          ) : null}
          {errorMessage ? (
            <div className={styles.stateBox}>
              <p>{errorMessage}</p>
              <Button type="button" variant="secondary" onClick={() => void loadPage(0, "replace")}>
                다시 시도
              </Button>
            </div>
          ) : null}
          {shouldShowEmptyState ? (
            <p className={styles.stateText}>
              {hasKeyword ? "검색 결과 없음" : "아직 표시할 크루가 없습니다."}
            </p>
          ) : null}

          {crews.length > 0 ? (
            <ul className={styles.crewGrid}>
              {crews.map((crew) => (
                <li key={crew.crewId}>
                  <article
                    className={styles.crewCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCrew(crew)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCrew(crew);
                      }
                    }}
                  >
                    {crew.imageUrl ? (
                      <Image
                        src={crew.imageUrl}
                        alt={`${crew.name} 대표 이미지`}
                        width={96}
                        height={96}
                        className={styles.crewImage}
                      />
                    ) : (
                      <div className={styles.imageFallback} aria-label="대표 이미지 없음">
                        이미지 준비 중
                      </div>
                    )}
                    <div className={styles.cardBody}>
                      <h3>
                        <Link
                          href={`/crews/public/${crew.crewId}`}
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedCrew(crew);
                          }}
                        >
                          {crew.name}
                        </Link>
                      </h3>
                      <div className={styles.metaRow}>
                        <Chip
                          size="sm"
                          variant="normal"
                          className={styles.metaChip}
                          leftIcon={<span className={styles.chipSquareIcon} aria-hidden="true" />}
                        >
                          {getVisibilityLabel(crew.visibility)} 크루
                        </Chip>
                        <Chip
                          size="sm"
                          variant="normal"
                          className={styles.metaChip}
                          leftIcon={<span className={styles.chipSquareIcon} aria-hidden="true" />}
                        >
                          멤버 {crew.memberCount}명
                        </Chip>
                        <Chip
                          size="sm"
                          variant="normal"
                          className={styles.metaChip}
                          leftIcon={<span className={styles.chipAvatarIcon} aria-hidden="true">A</span>}
                        >
                          {crew.leaderNickname}
                        </Chip>
                      </div>
                      <p>{crew.description ?? "소개가 아직 없습니다."}</p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : null}

          {loadMoreErrorMessage ? <p className={styles.stateText}>{loadMoreErrorMessage}</p> : null}
          {isLoadingMore ? <p className={styles.stateText}>크루를 더 불러오고 있습니다.</p> : null}
          {hasNext ? (
            <Button
              type="button"
              variant="ghost"
              className={styles.moreButton}
              disabled={isLoadingMore}
              onClick={() => void loadPage(page + 1, "append")}
            >
              더 보기
            </Button>
          ) : null}
        </section>
      </main>
      {selectedCrew ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setSelectedCrew(null)}
        >
          <section
            aria-labelledby="crew-detail-modal-title"
            aria-modal="true"
            className={styles.detailModal}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <IconButton
              type="button"
              size="md"
              variant="background"
              className={styles.modalCloseButton}
              aria-label="닫기"
              onClick={() => setSelectedCrew(null)}
            >
              ×
            </IconButton>
            <div className={styles.modalScrollArea}>
              <div className={styles.modalHero}>
                {selectedCrew.imageUrl ? (
                  <Image
                    src={selectedCrew.imageUrl}
                    alt={`${selectedCrew.name} 대표 이미지`}
                    width={700}
                    height={360}
                    className={styles.modalHeroImage}
                  />
                ) : (
                  <div className={styles.modalHeroFallback} aria-label="대표 이미지 없음" />
                )}
              </div>

              <div className={styles.modalContent}>
                <h2 id="crew-detail-modal-title">{selectedCrew.name}</h2>
                <div className={styles.modalMetaGrid}>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaIcon} aria-hidden="true" />
                    <span>공개 여부</span>
                    <strong>{getVisibilityLabel(selectedCrew.visibility)}</strong>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaIcon} aria-hidden="true" />
                    <span>크루 인원</span>
                    <strong>{selectedCrew.memberCount}명</strong>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaIcon} aria-hidden="true" />
                    <span>크루장</span>
                    <strong>{selectedCrew.leaderNickname}</strong>
                  </div>
                </div>

                <hr className={styles.modalDivider} />

                <section className={styles.modalInfoBox}>
                  <h3>한줄 크루 소개</h3>
                  <p>{selectedCrew.description ?? "소개가 아직 없습니다."}</p>
                </section>

                <hr className={styles.modalDivider} />

                <div className={styles.modalPolicyList} aria-label="크루 상세 정보">
                  <details className={styles.modalPolicyItem} open>
                    <summary>
                      <span>참여 기준</span>
                      <span className={styles.policyToggleIcon} aria-hidden="true" />
                    </summary>
                    <p>
                      정기 모임에 한 달 2회 이상 참여를 권장합니다.
                      <br />
                      참여가 어려운 경우에는 사전에 크루장에게 미리 알려주세요.
                      <br />
                      장기간 미참여 시 크루 운영 상황에 따라 크루원 자격이 조정될 수 있습니다.
                    </p>
                  </details>
                  <details className={styles.modalPolicyItem}>
                    <summary>
                      <span>크루 문화</span>
                      <span className={styles.policyToggleIcon} aria-hidden="true" />
                    </summary>
                    <p>서로의 취향을 존중하고 즐거운 방탈출 경험을 함께 만들어가요.</p>
                  </details>
                  <details className={styles.modalPolicyItem}>
                    <summary>
                      <span>크루 문화</span>
                      <span className={styles.policyToggleIcon} aria-hidden="true" />
                    </summary>
                    <p>약속 시간을 지키고 모임 변경 사항은 미리 공유해 주세요.</p>
                  </details>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="primary"
                className={styles.joinButton}
                onClick={() => setIsJoinModalOpen(true)}
              >
                가입하기
              </Button>
            </div>
          </section>
          {isJoinModalOpen || isJoinCompleteModalOpen ? (
            <div
              className={styles.joinModalBackdrop}
              role="presentation"
              onClick={(event) => {
                event.stopPropagation();
                setIsJoinModalOpen(false);
                setIsJoinCompleteModalOpen(false);
              }}
            >
              {isJoinCompleteModalOpen ? (
                <section
                  aria-labelledby="crew-join-complete-modal-title"
                  aria-modal="true"
                  className={styles.joinCompleteModal}
                  role="dialog"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.joinCompleteGraphic} aria-hidden="true" />
                  <div className={styles.joinCompleteCopy}>
                    <h2 id="crew-join-complete-modal-title">
                      크루장에게 가입인사를 전달했어요
                    </h2>
                    <p>가입승인이 되면 바로 크루원으로 활동 할 수 있어요</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className={styles.joinCompleteButton}
                    onClick={() => {
                      setIsJoinCompleteModalOpen(false);
                      setIsJoinModalOpen(false);
                    }}
                  >
                    완료
                  </Button>
                </section>
              ) : (
                <section
                  aria-labelledby="crew-join-modal-title"
                  aria-modal="true"
                  className={styles.joinModal}
                  role="dialog"
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconButton
                    type="button"
                    size="md"
                    variant="background"
                    className={styles.joinModalCloseButton}
                    aria-label="닫기"
                    onClick={() => setIsJoinModalOpen(false)}
                  >
                    ×
                  </IconButton>
                  <h2 id="crew-join-modal-title">
                    크루장이 확인할
                    <br />
                    가입인사를 남겨보세요!
                  </h2>
                  <Textarea
                    label="내용 작성하기"
                    value={joinMessage}
                    placeholder="안녕하세요! 간단한 인사글을 쓰고 싶어요"
                    className={styles.joinMessageTextarea}
                    onChange={(event) => setJoinMessage(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    className={styles.joinSubmitButton}
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setIsJoinCompleteModalOpen(true);
                    }}
                  >
                    보내기
                  </Button>
                </section>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
