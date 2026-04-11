"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { toCompletionPath } from "@/shared/auth/guards";
import { getUserMessage } from "@/shared/errors/operational";
import {
  acceptCrewInvite,
  getMyCrewInvites,
  rejectCrewInvite,
} from "@/shared/crew/client";
import type { MyCrewInvite } from "@/shared/crew/types";
import { reportOperationalError } from "@/shared/monitoring/operations";

const MY_INVITES_PATH = "/crew-invites";

export function MyCrewInvitesPageClient() {
  const router = useRouter();
  const [items, setItems] = useState<MyCrewInvite[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<number | null>(null);

  const pendingCount = useMemo(
    () => items.filter((invite) => invite.status === "PENDING").length,
    [items],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInvites() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        if (me.authStatus === "GUEST") {
          router.replace(`/login?redirectTo=${encodeURIComponent(MY_INVITES_PATH)}`);
          return;
        }

        if (me.authStatus !== "FULL" || me.completionRequired) {
          router.replace(toCompletionPath(MY_INVITES_PATH));
          return;
        }

        const response = await getMyCrewInvites();

        if (!isMounted) {
          return;
        }

        setItems(response);
        setIsLoading(false);
      } catch (error) {
        reportOperationalError("crew.my_invites_load_failed", error, {
          route: MY_INVITES_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(error, "내 초대 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void loadInvites();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleAccept(inviteId: number) {
    setActiveInviteId(inviteId);
    setErrorMessage(null);

    try {
      const response = await acceptCrewInvite(inviteId);
      setItems((current) =>
        current.map((item) =>
          item.inviteId === response.inviteId ? { ...item, status: response.status } : item,
        ),
      );
    } catch (error) {
      reportOperationalError("crew.my_invite_accept_failed", error, {
        route: MY_INVITES_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "초대 수락에 실패했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setActiveInviteId(null);
    }
  }

  async function handleReject(inviteId: number) {
    setActiveInviteId(inviteId);
    setErrorMessage(null);

    try {
      const response = await rejectCrewInvite(inviteId);
      setItems((current) =>
        current.map((item) =>
          item.inviteId === response.inviteId ? { ...item, status: response.status } : item,
        ),
      );
    } catch (error) {
      reportOperationalError("crew.my_invite_reject_failed", error, {
        route: MY_INVITES_PATH,
      });
      setErrorMessage(
        getUserMessage(error, "초대 거절에 실패했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setActiveInviteId(null);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>내 초대 목록을 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>My invites</h1>
      <p>Pending invites: {pendingCount}</p>
      {errorMessage ? <p>{errorMessage}</p> : null}

      <ul>
        {items.map((invite) => {
          const isPending = invite.status === "PENDING";
          const isBusy = activeInviteId === invite.inviteId;

          return (
            <li key={invite.inviteId}>
              <p>{invite.crewName}</p>
              <p>Invited by: {invite.inviterNickname}</p>
              <p>{invite.status}</p>

              {invite.status === "APPROVED" ? (
                <Link href={`/crews/${invite.crewId}`}>Go to crew {invite.crewId}</Link>
              ) : null}

              {isPending ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleAccept(invite.inviteId)}
                    disabled={isBusy}
                    aria-label={`Accept invite ${invite.inviteId}`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(invite.inviteId)}
                    disabled={isBusy}
                    aria-label={`Reject invite ${invite.inviteId}`}
                  >
                    Reject
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
