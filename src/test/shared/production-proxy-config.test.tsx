import { afterEach, describe, expect, it, vi } from "vitest";

describe("next production proxy config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rewrites same-origin backend routes to the configured backend target", async () => {
    vi.stubEnv("BANGLOG_BACKEND_PROXY_TARGET", "http://52.78.247.203:8080/");

    const { default: nextConfig } = await import("../../../next.config");
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual([
      {
        source: "/backend/:path*",
        destination: "http://52.78.247.203:8080/:path*",
      },
    ]);
  });

  it("keeps the legacy BANGPOT_BACKEND_PROXY_TARGET as a fallback during migration", async () => {
    vi.stubEnv("BANGPOT_BACKEND_PROXY_TARGET", "http://52.78.247.203:8080/");

    const { default: nextConfig } = await import("../../../next.config");
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual([
      {
        source: "/backend/:path*",
        destination: "http://52.78.247.203:8080/:path*",
      },
    ]);
  });
});
