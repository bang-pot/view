"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getUserMessage } from "@/shared/errors/operational";
import { getPublicCrews } from "@/shared/crew/client";
import type { PublicCrewSummary } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

const PUBLIC_CREWS_PATH = "/crews/public";

export function PublicCrewsPageClient() {
  const [crews, setCrews] = useState<PublicCrewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getPublicCrews()
      .then((nextCrews) => {
        if (!isMounted) {
          return;
        }

        setCrews(nextCrews);
        setIsLoading(false);
      })
      .catch((error) => {
        reportOperationalError("crew.public.list_failed", error, {
          route: PUBLIC_CREWS_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "공개 크루 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main>
        <p>공개 크루 목록을 불러오고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Public crews</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <ul>
        {crews.map((crew) => (
          <li key={crew.crewId}>
            <article>
              <h2>
                <Link href={`/crews/public/${crew.crewId}`}>{crew.name}</Link>
              </h2>
              <p>{crew.description ?? "소개가 아직 없습니다."}</p>
              <p>Visibility: {crew.visibility}</p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
