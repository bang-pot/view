import type { NextConfig } from "next";

function normalizeEnvValue(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

function resolveProxyTarget(): string | null {
  const publicApiBaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_API_BASE_URL);
  const proxyTarget = normalizeEnvValue(process.env.BANGPOT_BACKEND_PROXY_TARGET);

  if (publicApiBaseUrl?.startsWith("/") && !proxyTarget) {
    throw new Error(
      "BANGPOT_BACKEND_PROXY_TARGET is required when NEXT_PUBLIC_API_BASE_URL uses a same-origin proxy path.",
    );
  }

  return proxyTarget;
}

const nextConfig: NextConfig = {
  async rewrites() {
    const proxyTarget = resolveProxyTarget();

    if (!proxyTarget) {
      return [];
    }

    return [
      {
        source: "/backend/:path*",
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
