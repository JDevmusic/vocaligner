import { afterEach, describe, expect, it, vi } from "vitest";
import { getRedisClient, isUpstashConfigured } from "./upstashConfig";

const ENV_KEYS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"] as const;

function clearAllCredentialEnvVars() {
  for (const key of ENV_KEYS) delete process.env[key];
}

// File-scoped (not nested inside a single describe) so it restores process.env after
// *every* test below, including the separate "getRedisClient" describe -- vitest does not
// reset process.env between test files that share a worker process, only the module
// registry, so a describe that clears these vars and never restores them could otherwise
// leak a cleared (or missing) credential state into whichever test file runs next in the
// same worker.
const originalEnv: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) originalEnv[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  vi.restoreAllMocks();
});

describe("isUpstashConfigured", () => {
  it("is false when nothing is set", () => {
    clearAllCredentialEnvVars();
    expect(isUpstashConfigured()).toBe(false);
  });

  it("is true when the modern UPSTASH_* pair is set", () => {
    clearAllCredentialEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    expect(isUpstashConfigured()).toBe(true);
  });

  it("is true when the legacy KV_* pair is set (Vercel KV compatibility)", () => {
    clearAllCredentialEnvVars();
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "test-token";
    expect(isUpstashConfigured()).toBe(true);
  });

  it("is true with a mix -- UPSTASH_* url and KV_* token -- matching Redis.fromEnv()'s own independent-per-field fallback", () => {
    clearAllCredentialEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "test-token";
    expect(isUpstashConfigured()).toBe(true);
  });

  it("is false and warns when only the URL half of a pair is set (likely misconfiguration, not intentional)", () => {
    clearAllCredentialEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(isUpstashConfigured()).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("is false and warns when only the token half of a pair is set", () => {
    clearAllCredentialEnvVars();
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(isUpstashConfigured()).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("treats a whitespace-only value the same as unset", () => {
    clearAllCredentialEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "   ";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(isUpstashConfigured()).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

// Run in isolation from the suite above: getRedisClient() memoizes a module-level
// singleton on first successful call, so this must be the only test in the file that
// calls it, and must run while credentials are genuinely absent -- otherwise a prior
// successful construction would make this pass for the wrong reason (returning the
// cached client instead of actually re-checking configuration). The file-level afterEach
// above still restores process.env after this test runs, same as every other test here.
describe("getRedisClient", () => {
  it("throws a clear error when called without Upstash configured", () => {
    clearAllCredentialEnvVars();
    expect(() => getRedisClient()).toThrow(/without Upstash configured/i);
  });
});
