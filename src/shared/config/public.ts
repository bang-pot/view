import { OperationalError } from "@/shared/errors/operational";

export type PublicAppEnv = "local" | "prod";

export const LOCAL_API_BASE_URL = "http://localhost:8080";

const VALID_APP_ENVS: ReadonlySet<string> = new Set(["local", "prod"]);

function normalizeApiBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

export function resolvePublicAppEnv(): PublicAppEnv {
  const explicitAppEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim();

  if (explicitAppEnv) {
    if (VALID_APP_ENVS.has(explicitAppEnv)) {
      return explicitAppEnv as PublicAppEnv;
    }

    throw new OperationalError({
      code: "FRONTEND_PUBLIC_ENV_INVALID",
      userMessage: "서비스 연결 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      path: "/",
      cause: new Error(`Unsupported NEXT_PUBLIC_APP_ENV: ${explicitAppEnv}`),
    });
  }

  return process.env.NODE_ENV === "production" ? "prod" : "local";
}

export function getPublicRuntimeConfig(): { appEnv: PublicAppEnv; apiBaseUrl: string } {
  const appEnv = resolvePublicAppEnv();
  const configuredApiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (configuredApiBaseUrl) {
    return {
      appEnv,
      apiBaseUrl: configuredApiBaseUrl,
    };
  }

  if (appEnv === "local") {
    return {
      appEnv,
      apiBaseUrl: LOCAL_API_BASE_URL,
    };
  }

  throw new OperationalError({
    code: "FRONTEND_PUBLIC_CONFIG_MISSING",
    userMessage: "서비스 연결 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    path: "/",
    cause: new Error(
      "NEXT_PUBLIC_API_BASE_URL is required when NEXT_PUBLIC_APP_ENV is prod.",
    ),
  });
}
