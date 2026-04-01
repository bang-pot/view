"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";

const PROTECTED_PATH = "/protected-demo";

export function ProtectedDemoPageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getMe()
      .then((me) => {
        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, PROTECTED_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          router.replace(`/login?redirectTo=${encodeURIComponent(PROTECTED_PATH)}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return <main><p>권한을 확인하고 있습니다.</p></main>;
  }

  return (
    <main>
      <h1>Protected Demo</h1>
      <p>이 화면은 full 사용자만 볼 수 있는 auth guard 예시입니다.</p>
      <Link href="/">메인으로 이동</Link>
    </main>
  );
}
