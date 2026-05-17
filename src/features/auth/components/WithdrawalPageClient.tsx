"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { getMe, getWithdrawalCheck, withdrawUser } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import type {
  WithdrawalCheckResponse,
  WithdrawalReasonCode,
} from "@/shared/auth/types";
import { getUserMessage, toOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const WITHDRAWAL_PATH = "/profile/withdrawal";

const REASON_OPTIONS: Array<{ code: WithdrawalReasonCode; label: string }> = [
  { code: "NOT_USING", label: "더 이상 사용하지 않아요" },
  { code: "SERVICE_UNSATISFIED", label: "서비스가 아쉬워요" },
  { code: "LOW_ACTIVITY", label: "활동이 줄었어요" },
  { code: "OTHER", label: "기타" },
];

type WithdrawalStep = "guard" | "execute" | "completed";

const cardStyle = {
  display: "grid",
  gap: 12,
  padding: 20,
  border: "1px solid #d9d9d9",
  borderRadius: 16,
};

export function WithdrawalPageClient() {
  const router = useRouter();
  const hasBootstrappedRef = useRef(false);
  const [withdrawalCheck, setWithdrawalCheck] = useState<WithdrawalCheckResponse | null>(null);
  const [step, setStep] = useState<WithdrawalStep>("guard");
  const [reasonCode, setReasonCode] = useState<WithdrawalReasonCode | null>(null);
  const [reasonDetail, setReasonDetail] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  async function loadWithdrawalCheck() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getWithdrawalCheck();
      setWithdrawalCheck(response);
      return response;
    } catch (error) {
      reportOperationalError("auth.withdrawal_check.request_failed", error, {
        route: WITHDRAWAL_PATH,
      });
      setErrorMessage(
        getUserMessage(
          error,
          "회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function resetExecutionState() {
    setStep("guard");
    setReasonCode(null);
    setReasonDetail("");
    setConfirmationChecked(false);
    setIsSubmitting(false);
  }

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const destination = resolveProtectedDestination(me, WITHDRAWAL_PATH);
        if (destination) {
          router.replace(destination);
          return;
        }

        await loadWithdrawalCheck();
      } catch (error) {
        reportOperationalError("auth.withdrawal_check.auth_failed", error, {
          route: WITHDRAWAL_PATH,
        });

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleRetry() {
    setSubmitErrorMessage(null);
    await loadWithdrawalCheck();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reasonCode || !confirmationChecked || isSubmitting) {
      return;
    }

    setSubmitErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await withdrawUser({
        reasonCode,
        reasonDetail: reasonCode === "OTHER" ? reasonDetail.trim() || null : null,
        confirmationChecked: true,
      });

      if (response.canLogin === false) {
        setStep("completed");
      }
    } catch (error) {
      const operationalError = toOperationalError(error);

      reportOperationalError("auth.withdrawal.execute_failed", operationalError, {
        level: operationalError.code === "AUTH_WITHDRAWAL_NOT_ALLOWED" ? "warn" : "error",
        route: WITHDRAWAL_PATH,
      });

      if (operationalError.code === "AUTH_WITHDRAWAL_NOT_ALLOWED" || operationalError.status === 409) {
        setSubmitErrorMessage(
          getUserMessage(
            operationalError,
            "회원탈퇴 전에 정리해야 하는 관계가 생겼어요. 최신 상태를 다시 확인해 주세요.",
          ),
        );

        const latestCheck = await loadWithdrawalCheck();
        if (latestCheck) {
          resetExecutionState();
        }
        return;
      }

      setSubmitErrorMessage(
        getUserMessage(
          operationalError,
          "회원탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main style={{ display: "grid", gap: 16 }}>
        <h1>회원탈퇴</h1>
        <p>회원탈퇴 정보를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (!withdrawalCheck) {
    return (
      <main style={{ display: "grid", gap: 16 }}>
        <h1>회원탈퇴</h1>
        <p>{errorMessage ?? "회원탈퇴 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."}</p>
        <div>
          <button type="button" onClick={() => void handleRetry()}>
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (step === "completed") {
    return (
      <main style={{ display: "grid", gap: 20 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <h1>회원탈퇴</h1>
          <p>탈퇴 요청이 정상적으로 완료되었어요.</p>
        </header>

        <section style={cardStyle}>
          <h2>회원탈퇴가 완료되었어요.</h2>
          <p>재가입은 가능하지만 기존 데이터는 복구되지 않아요.</p>
          <div>
            <button type="button" onClick={() => router.replace("/login")}>
              로그인 화면으로
            </button>
          </div>
        </section>
      </main>
    );
  }

  const canSubmit = Boolean(reasonCode && confirmationChecked && !isSubmitting);

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1>회원탈퇴</h1>
        <p>지금 탈퇴할 수 있는지 먼저 확인하고, 정리해야 하는 관계가 있으면 한 번에 안내해드릴게요.</p>
      </header>

      <section aria-label="회원탈퇴 영향 안내" style={{ display: "grid", gap: 16 }}>
        <section style={cardStyle}>
          <h2>삭제되는 것</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>개인 프로필 정보와 로그인 계정 정보가 제거됩니다.</li>
            <li>탈퇴를 완료하면 현재 계정으로는 Banglog를 다시 사용할 수 없어요.</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h2>유지되는 것</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>기록성 데이터는 운영 정책에 따라 일부 유지될 수 있어요.</li>
            <li>탈퇴 전에는 활성 크루 소속을 먼저 정리해야 해요.</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h2>재가입 가능 여부</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>재가입은 가능하지만, 탈퇴 전 데이터는 복구되지 않아요.</li>
          </ul>
        </section>
      </section>

      {submitErrorMessage ? (
        <p style={{ margin: 0, color: "#c62828" }}>{submitErrorMessage}</p>
      ) : null}

      {withdrawalCheck.canWithdraw ? (
        step === "guard" ? (
          <section style={cardStyle}>
            <h2>지금은 괜찮아요</h2>
            <p>지금은 회원탈퇴 다음 단계로 진행할 수 있어요.</p>
            <div>
              <button type="button" onClick={() => setStep("execute")}>
                다음 단계로
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 20 }}>
            <section style={cardStyle}>
              <h2>탈퇴 사유 선택</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {REASON_OPTIONS.map((option) => (
                  <label key={option.code} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="withdrawal-reason"
                      value={option.code}
                      checked={reasonCode === option.code}
                      onChange={() => setReasonCode(option.code)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              {reasonCode === "OTHER" ? (
                <label style={{ display: "grid", gap: 8 }}>
                  <span>상세 사유 (선택)</span>
                  <textarea
                    value={reasonDetail}
                    onChange={(event) => setReasonDetail(event.target.value)}
                    rows={4}
                  />
                </label>
              ) : null}
            </section>

            <section style={cardStyle}>
              <h2>최종 확인</h2>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(event) => setConfirmationChecked(event.target.checked)}
                />
                <span>안내된 내용을 모두 확인했어요</span>
              </label>
            </section>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => resetExecutionState()} disabled={isSubmitting}>
                이전으로
              </button>
              <button type="submit" disabled={!canSubmit}>
                {isSubmitting ? "처리 중..." : "회원탈퇴"}
              </button>
            </div>
          </form>
        )
      ) : (
        <section style={cardStyle}>
          <h2>지금은 탈퇴할 수 없어요</h2>
          <p>회원탈퇴 전에 활성 크루 관계를 먼저 정리해야 해요.</p>

          <section style={{ display: "grid", gap: 8 }}>
            <h3>정리해야 하는 크루</h3>
            {withdrawalCheck.blockingActiveCrews.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                {withdrawalCheck.blockingActiveCrews.map((crew) => (
                  <li key={crew.crewId}>{crew.crewName}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>현재 정리해야 하는 크루가 없어요.</p>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
