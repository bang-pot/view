"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buildKakaoLoginUrl, getMe } from "@/shared/auth/client";
import { resolveLoginReentryDestination, sanitizeRedirectPath } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

function resolveErrorMessage(errorCode: string | null): string | null {
  if (errorCode === "oauth_failed") {
    return "카카오 로그인에 실패했습니다. 다시 시도해 주세요.";
  }

  return null;
}

function resolveLoginEntry(redirectTo: string): {
  loginUrl: string | null;
  setupError: unknown;
} {
  try {
    return {
      loginUrl: buildKakaoLoginUrl(redirectTo),
      setupError: null,
    };
  } catch (error) {
    return {
      loginUrl: null,
      setupError: error,
    };
  }
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = sanitizeRedirectPath(searchParams.get("redirectTo"));
  const [isLoading, setIsLoading] = useState(true);
  const errorMessage = resolveErrorMessage(searchParams.get("error"));
  const { loginUrl, setupError } = resolveLoginEntry(requestedPath);
  const loginSetupMessage = setupError
    ? getUserMessage(
        setupError,
        "로그인 연결을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      )
    : null;

  useEffect(() => {
    let isMounted = true;
    const shouldStayOnLoginPage = Boolean(errorMessage);

    if (setupError) {
      reportOperationalError("auth.login.configuration_invalid", setupError, {
        route: "/login",
      });

      return () => {
        isMounted = false;
      };
    }

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

        if (loginUrl && !shouldStayOnLoginPage) {
          window.location.assign(loginUrl);
          return;
        }

        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("auth.login.bootstrap_failed", error, {
          route: "/login",
        });

        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [errorMessage, loginUrl, requestedPath, router, setupError]);

  if (!setupError && isLoading) {
    return (
      <main>
        <p>로그인 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Banglog 로그인</h1>
      <p>카카오 로그인으로만 Banglog에 들어올 수 있습니다.</p>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {loginSetupMessage ? <p>{loginSetupMessage}</p> : null}
      {loginUrl ? (
        <a href={loginUrl} target="_self" rel="external">
          카카오로 시작하기
        </a>
      ) : null}
    </main>
  );
}
