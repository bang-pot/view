"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { getMeetingLogDetail } from "@/shared/log/client";
import type { MeetingLogDetail } from "@/shared/log/types";

type MeetingLogDetailPageClientProps = {
  logId: string;
};

export function MeetingLogDetailPageClient({
  logId,
}: MeetingLogDetailPageClientProps) {
  const router = useRouter();
  const [log, setLog] = useState<MeetingLogDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logIdNumber = Number(logId);
  const hasValidLogId = Number.isFinite(logIdNumber);
  const routePath = useMemo(() => `/logs/${logId}`, [logId]);

  useEffect(() => {
    if (!hasValidLogId) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, routePath);

        if (destination) {
          router.replace(destination);
          return;
        }

        const detail = await getMeetingLogDetail(logIdNumber);

        if (!isMounted) {
          return;
        }

        setLog(detail);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        reportOperationalError("log.detail.bootstrap_failed", error, {
          level: "warn",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "방탈로그 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [hasValidLogId, logIdNumber, routePath, router]);

  if (!hasValidLogId) {
    return (
      <main>
        <h1>방탈로그 상세</h1>
        <p>올바르지 않은 방탈로그 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>방탈로그 상세를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (!log) {
    return (
      <main>
        <h1>방탈로그 상세</h1>
        <p>{errorMessage ?? "방탈로그 상세를 불러오지 못했어요."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>방탈로그 상세</h1>
      <p>{log.meetingTitle}</p>
      <p>
        {log.themeName} · {log.place} · {log.date}
      </p>
      <p>작성자: {log.authorNickname}</p>
      <p>작성일: {log.createdAt}</p>
      <p>수정일: {log.updatedAt}</p>

      <section aria-label="방탈로그 본문" style={{ marginTop: 16 }}>
        <h2>기록 내용</h2>
        <p>{log.body}</p>
      </section>

      <section aria-label="방탈로그 사진" style={{ marginTop: 16 }}>
        <h2>사진</h2>
        {log.photos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {log.photos.map((photo, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={`${log.themeName} 방탈로그 사진 ${index + 1}`}
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            ))}
          </div>
        ) : (
          <p>등록된 사진이 없어요.</p>
        )}
      </section>
    </main>
  );
}
