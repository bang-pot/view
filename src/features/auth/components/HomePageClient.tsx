"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FullUserAuthMenu } from "@/features/auth/components/FullUserAuthMenu";
import { getMe } from "@/shared/auth/client";
import type { AuthMeResponse } from "@/shared/auth/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

type HomePageClientProps = {
  notice?: string | null;
};

export function HomePageClient({ notice = null }: HomePageClientProps) {
  const [me, setMe] = useState<AuthMeResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((currentUser) => {
        if (isMounted) {
          setMe(currentUser);
        }
      })
      .catch((error) => {
        reportOperationalError("auth.home.bootstrap_failed", error, {
          level: "warn",
          route: "/",
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main>
      <h1>BangPot</h1>
      <p>방탈출 크루를 찾고, 모임을 만들고, 함께 기록해 보세요.</p>
      {notice === "crew-left" ? <p>크루를 탈퇴했습니다.</p> : null}
      {notice === "crew-deleted" ? <p>크루를 삭제했습니다.</p> : null}
      <ul>
        <li>
          <Link href="/login">로그인</Link>
        </li>
        <li>
          <Link href="/explore">탐색하기</Link>
        </li>
        <li>
          <Link href="/crews/public">공개 크루 둘러보기</Link>
        </li>
        {me?.authStatus === "FULL" ? (
          <li>
            <FullUserAuthMenu route="/" />
          </li>
        ) : null}
      </ul>
    </main>
  );
}
