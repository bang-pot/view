"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buildKakaoLoginUrl, getMe } from "@/shared/auth/client";
import { resolveLoginReentryDestination, sanitizeRedirectPath } from "@/shared/auth/guards";

function resolveErrorMessage(errorCode: string | null): string | null {
  if (errorCode === "oauth_failed") {
    return "카카오 로그인에 실패했습니다. 다시 시도해 주세요.";
  }

  return null;
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const [isLoading, setIsLoading] = useState(true);
  const errorMessage = resolveErrorMessage(searchParams.get("error"));

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((me) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveLoginReentryDestination(me, requestedPath);
        if (destination) {
          router.replace(destination);
          return;
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestedPath, router]);

  if (isLoading) {
    return (
      <main>
        <p>로그인 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>BangPot 로그인</h1>
      <p>카카오 로그인으로만 BangPot에 들어올 수 있습니다.</p>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <Link href={buildKakaoLoginUrl(requestedPath)}>카카오로 시작하기</Link>
    </main>
  );
}
