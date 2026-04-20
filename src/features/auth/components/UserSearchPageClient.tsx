"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type { UserSearchItem } from "@/shared/auth/types";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

import { UserSearchPanel } from "./UserSearchPanel";

const MEMBER_SEARCH_PATH = "/member-search";

export function UserSearchPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, MEMBER_SEARCH_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        setIsReady(true);
      } catch (error) {
        reportOperationalError("auth.user_search.auth_failed", error, {
          route: MEMBER_SEARCH_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "회원 검색 화면을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isReady && !errorMessage) {
    return (
      <main>
        <h1>회원 검색</h1>
        <p>회원 검색 화면을 준비하는 중입니다.</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={{ display: "grid", gap: 12 }}>
        <h1>회원 검색</h1>
        <p>{errorMessage}</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1>회원 검색</h1>
        <p>닉네임으로 회원을 검색하고, 이후 consumer에서 선택 결과를 이어서 사용할 수 있어요.</p>
        <div>
          <Link href="/profile">프로필 허브로 돌아가기</Link>
        </div>
      </header>

      <UserSearchPanel route={MEMBER_SEARCH_PATH} onSelect={setSelectedUser} />

      {selectedUser ? (
        <section style={{ display: "grid", gap: 6 }}>
          <h2>선택 결과</h2>
          <p>{selectedUser.nickname}</p>
          <p>{selectedUser.bio ?? "한줄소개가 아직 없어요"}</p>
          <p>{`방수 ${selectedUser.escapeCount}회`}</p>
        </section>
      ) : null}
    </main>
  );
}
