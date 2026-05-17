import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OperationalError } from "@/shared/errors/operational";
import {
  LOCAL_API_BASE_URL,
  getPublicRuntimeConfig,
  resolvePublicAppEnv,
} from "@/shared/config/public";

const ORIGINAL_ENV = { ...process.env };

describe("public runtime config", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("uses the local fallback API base URL only for the local app env", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "local";

    expect(getPublicRuntimeConfig()).toEqual({
      appEnv: "local",
      apiBaseUrl: LOCAL_API_BASE_URL,
    });
  });

  it("requires an explicit API base URL for prod deployments", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "prod";

    expect(() => getPublicRuntimeConfig()).toThrowError(
      expect.objectContaining<Partial<OperationalError>>({
        code: "FRONTEND_PUBLIC_CONFIG_MISSING",
        userMessage: "서비스 연결 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        path: "/",
      }),
    );
  });

  it("normalizes configured API base URLs for prod deployments", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "prod";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.banglog.example.com/";

    expect(getPublicRuntimeConfig()).toEqual({
      appEnv: "prod",
      apiBaseUrl: "https://api.banglog.example.com",
    });
  });

  it("defaults production builds to the prod app env", () => {
    process.env.NODE_ENV = "production";

    expect(resolvePublicAppEnv()).toBe("prod");
  });
});
