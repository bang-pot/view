"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { searchUsers } from "@/shared/auth/client";
import type { UserSearchItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

type UserSearchPanelProps = {
  route: string;
  onSelect?: (user: UserSearchItem | null) => void;
  selectedUserId?: number | null;
  size?: number;
};

function toGenderLabel(gender: string | null): string {
  if (gender === "MALE") {
    return "남성";
  }

  if (gender === "FEMALE") {
    return "여성";
  }

  return "미설정";
}

export function UserSearchPanel({
  route,
  onSelect,
  selectedUserId,
  size = 20,
}: UserSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<UserSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmittedKeyword, setLastSubmittedKeyword] = useState<string | null>(null);
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<number | null>(null);

  const effectiveSelectedUserId = selectedUserId ?? internalSelectedUserId;
  const hasSubmittedSearch = lastSubmittedKeyword !== null;
  const showIdleState = !hasSubmittedSearch && !isSearching && !errorMessage;
  const showEmptyState =
    hasSubmittedSearch && !isSearching && !errorMessage && items.length === 0;

  const selectedItem = useMemo(
    () => items.find((item) => item.userId === effectiveSelectedUserId) ?? null,
    [effectiveSelectedUserId, items],
  );

  async function runSearch(rawKeyword: string) {
    const nextKeyword = rawKeyword.trim();

    if (!nextKeyword) {
      setItems([]);
      setErrorMessage(null);
      setLastSubmittedKeyword(null);
      setInternalSelectedUserId(null);
      onSelect?.(null);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setLastSubmittedKeyword(nextKeyword);

    try {
      const response = await searchUsers({
        keyword: nextKeyword,
        size,
      });

      setItems(response.items);

      const stillSelected = response.items.some(
        (item) => item.userId === effectiveSelectedUserId,
      );

      if (!stillSelected) {
        setInternalSelectedUserId(null);
        onSelect?.(null);
      }
    } catch (error) {
      reportOperationalError("auth.user_search.request_failed", error, {
        route,
      });
      setErrorMessage(
        getUserMessage(error, "회원 검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelect(user: UserSearchItem) {
    setInternalSelectedUserId(user.userId);
    onSelect?.(user);
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await runSearch(keyword);
  }

  async function handleRetry() {
    if (!lastSubmittedKeyword) {
      return;
    }

    await runSearch(lastSubmittedKeyword);
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="member-search-keyword">닉네임 검색</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            id="member-search-keyword"
            name="member-search-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="닉네임을 입력하세요"
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>
      </form>

      {selectedItem ? (
        <p aria-live="polite">선택한 회원 {selectedItem.nickname}</p>
      ) : null}

      {showIdleState ? <p>닉네임으로 회원을 검색해보세요</p> : null}

      {isSearching ? <p>회원 검색 결과를 불러오는 중입니다.</p> : null}

      {errorMessage ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p>{errorMessage}</p>
          <div>
            <button type="button" onClick={() => void handleRetry()} disabled={isSearching}>
              다시 시도
            </button>
          </div>
        </div>
      ) : null}

      {showEmptyState ? <p>검색 결과가 없어요</p> : null}

      {items.length > 0 ? (
        <ul
          aria-label="회원 검색 결과"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: 12,
          }}
        >
          {items.map((item) => {
            const isSelected = effectiveSelectedUserId === item.userId;

            return (
              <li
                key={item.userId}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${item.nickname} 선택`}
                  onClick={() => handleSelect(item)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    display: "grid",
                    gap: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {item.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.profileImageUrl}
                        alt={`${item.nickname} 프로필 이미지`}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          objectFit: "cover",
                          background: "#f3f3f3",
                        }}
                      />
                    ) : (
                      <div
                        aria-label="기본 프로필 이미지"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          background: "#f3f3f3",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        기본 프로필 이미지
                      </div>
                    )}

                    <div style={{ display: "grid", gap: 4, flex: 1 }}>
                      <strong>{item.nickname}</strong>
                      <span>{item.bio ?? "한줄소개가 아직 없어요"}</span>
                      <span>{`성별 ${toGenderLabel(item.gender)}`}</span>
                      <span>{`방수 ${item.escapeCount}회`}</span>
                    </div>

                    {isSelected ? <span>선택됨</span> : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
