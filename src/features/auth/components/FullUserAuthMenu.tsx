"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logoutAndConfirmGuest } from "@/features/auth/logout";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

type FullUserAuthMenuProps = {
  route: string;
};

export function FullUserAuthMenu({ route }: FullUserAuthMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setErrorMessage(null);
    setIsLoggingOut(true);

    try {
      const isGuest = await logoutAndConfirmGuest();

      if (isGuest) {
        router.replace("/login");
        return;
      }

      setErrorMessage("로그아웃 상태를 확인하지 못했습니다. 다시 시도해 주세요.");
    } catch (error) {
      reportOperationalError("auth.menu.logout_failed", error, {
        route,
      });

      setErrorMessage(
        getUserMessage(
          error,
          "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav aria-label="Full user menu">
      <ul>
        <li>
          <Link href="/crews/new">Create crew</Link>
        </li>
        <li>
          <Link href="/archive/meetings">완료된 모임 아카이브</Link>
        </li>
        <li>
          <Link href="/profile">Profile</Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
            Logout
          </button>
        </li>
      </ul>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </nav>
  );
}
