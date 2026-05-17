import { resolvePublicAppEnv } from "@/shared/config/public";
import { toOperationalError } from "@/shared/errors/operational";

type OperationalLogLevel = "info" | "warn" | "error";

type OperationalLogPayload = {
  event: string;
  code?: string;
  status?: number;
  requestId?: string | null;
  path?: string;
  route?: string;
};

function sanitizePath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("/")) {
    return value.split("?")[0] || "/";
  }

  try {
    return new URL(value).pathname;
  } catch {
    return undefined;
  }
}

function sanitizeRequestId(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return /^[A-Za-z0-9._:-]{1,100}$/.test(value) ? value : "invalid-request-id";
}

function resolveLogEnv(): string {
  try {
    return resolvePublicAppEnv();
  } catch {
    return "unknown";
  }
}

export function reportOperationalEvent(
  level: OperationalLogLevel,
  payload: OperationalLogPayload,
): void {
  const message = {
    env: resolveLogEnv(),
    event: payload.event,
    code: payload.code,
    status: payload.status,
    requestId: sanitizeRequestId(payload.requestId),
    path: sanitizePath(payload.path),
    route: sanitizePath(payload.route),
  };

  if (level === "info") {
    console.info("[banglog-frontend]", message);
    return;
  }

  if (level === "warn") {
    console.warn("[banglog-frontend]", message);
    return;
  }

  console.error("[banglog-frontend]", message);
}

export function reportOperationalError(
  event: string,
  error: unknown,
  options?: {
    level?: OperationalLogLevel;
    route?: string;
  },
): void {
  const operationalError = toOperationalError(error);

  reportOperationalEvent(options?.level ?? "error", {
    event,
    code: operationalError.code,
    status: operationalError.status,
    requestId: operationalError.requestId,
    path: operationalError.path,
    route: options?.route,
  });
}
