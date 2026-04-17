"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

type ProfileActivityPlaceholderPageClientProps = {
  title: string;
  requestedPath: string;
};

export function ProfileActivityPlaceholderPageClient({
  title,
  requestedPath,
}: ProfileActivityPlaceholderPageClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((me) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, requestedPath);
        if (destination) {
          router.replace(destination);
          return;
        }

        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("auth.profile_activity.bootstrap_failed", error, {
          route: requestedPath,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "준비 중 화면을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestedPath, router]);

  if (isLoading) {
    return (
      <main>
        <p>준비 중 화면을 불러오는 중입니다.</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>{title}</h1>
      <p>{errorMessage ?? "상세 목록은 다음 라운드에서 이어서 구현할 예정입니다."}</p>
      <Link href="/profile">프로필 허브로 돌아가기</Link>
    </main>
  );
}
