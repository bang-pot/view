import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";

const ORIGINAL_ENV = { ...process.env };

describe("operations logger", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_APP_ENV: "prod" };
    errorSpy.mockClear();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("logs only sanitized operational metadata", () => {
    reportOperationalError(
      "auth.complete.submit_failed",
      new OperationalError({
        code: "AUTH_COMPLETE_REQUEST_FAILED",
        userMessage: "가입 완료 처리에 실패했습니다. 입력값을 다시 확인해 주세요.",
        path: "https://api.bangpot.example.com/api/auth/complete?nickname=potmaster",
        status: 500,
        requestId: "req-complete-1",
      }),
      {
        route: "/auth/complete?redirectTo=%2Fprotected-demo",
      },
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "[bangpot-frontend]",
      expect.objectContaining({
        env: "prod",
        event: "auth.complete.submit_failed",
        code: "AUTH_COMPLETE_REQUEST_FAILED",
        status: 500,
        requestId: "req-complete-1",
        path: "/api/auth/complete",
        route: "/auth/complete",
      }),
    );
    expect(JSON.stringify(errorSpy.mock.calls[0][1])).not.toContain("nickname=potmaster");
  });
});
