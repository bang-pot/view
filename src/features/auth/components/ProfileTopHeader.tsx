"use client";

import Link from "next/link";

import { BrandLogo } from "@/shared/ui/BrandLogo";

import styles from "./ProfileTopHeader.module.css";

export function ProfileTopHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="Banglog 홈" className={styles.logoLink}>
          <BrandLogo className={styles.logo} />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/" aria-current="page">
            홈
          </Link>
          <Link href="/crews/public">크루 탐색</Link>
          <Link href="/explore">방탈출 탐색</Link>
        </nav>
        <div className={styles.actions} aria-label="사용자 메뉴">
          <span className={styles.notificationIcon} aria-label="알림" role="img">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path d="M18 16.5h-12l1.5-2v-3.5a4.5 4.5 0 0 1 9 0v3.5l1.5 2Z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <Link href="/profile" aria-label="마이페이지" className={styles.avatarLink}>
            A
          </Link>
        </div>
      </div>
    </header>
  );
}
