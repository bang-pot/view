import type { AuthMeResponse } from "@/shared/auth/types";

export function sanitizeRedirectPath(redirectTo: string | null | undefined): string {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}

export function toCompletionPath(redirectTo: string | null | undefined): string {
  const safeRedirect = sanitizeRedirectPath(redirectTo);

  if (safeRedirect === "/") {
    return "/auth/complete";
  }

  return `/auth/complete?redirectTo=${encodeURIComponent(safeRedirect)}`;
}

export function resolveLoginReentryDestination(
  me: AuthMeResponse,
  requestedPath: string | null | undefined,
): string | null {
  if (me.authStatus === "TEMP" || me.completionRequired) {
    return toCompletionPath(me.redirectTo ?? requestedPath);
  }

  if (me.authStatus === "FULL") {
    return sanitizeRedirectPath(requestedPath);
  }

  return null;
}

export function resolveProtectedDestination(
  me: AuthMeResponse,
  requestedPath: string | null | undefined,
): string | null {
  const safeRequestedPath = sanitizeRedirectPath(requestedPath);

  if (me.authStatus === "GUEST") {
    return `/login?redirectTo=${encodeURIComponent(safeRequestedPath)}`;
  }

  if (me.authStatus === "TEMP" || me.completionRequired) {
    return toCompletionPath(me.redirectTo ?? safeRequestedPath);
  }

  return null;
}

export function resolveCompletionDestination(
  me: AuthMeResponse,
  requestedPath: string | null | undefined,
): string | null {
  const safeRequestedPath = sanitizeRedirectPath(requestedPath);

  if (me.authStatus === "GUEST") {
    return `/login?redirectTo=${encodeURIComponent(safeRequestedPath)}`;
  }

  if (me.authStatus === "FULL") {
    return sanitizeRedirectPath(me.redirectTo ?? safeRequestedPath);
  }

  return null;
}
