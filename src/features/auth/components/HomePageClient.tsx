"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FullUserAuthMenu } from "@/features/auth/components/FullUserAuthMenu";
import { getMe } from "@/shared/auth/client";
import type { AuthMeResponse } from "@/shared/auth/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

export function HomePageClient() {
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
      <h1>BangPot frontend bootstrap</h1>
      <p>Round 1 auth flow and Common Ops frontend baseline are ready.</p>
      <ul>
        <li><Link href="/login">로그인</Link></li>
        <li><Link href="/protected-demo">Protected demo</Link></li>
        <li><Link href="/crews/public">Public crews</Link></li>
        {me?.authStatus === "FULL" ? (
          <li><FullUserAuthMenu route="/" /></li>
        ) : null}
      </ul>
    </main>
  );
}
