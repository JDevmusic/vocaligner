import { afterEach, describe, expect, it } from "vitest";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;
const originalEnv: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) originalEnv[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("isSupabaseConfigured", () => {
  it("is false when neither is set", () => {
    clearEnv();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when only the URL is set", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is false when only the publishable key is set", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("is true when both are set", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("treats a whitespace-only value the same as unset", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe("getSupabaseUrl / getSupabasePublishableKey", () => {
  it("throws a clear error when the URL isn't configured", () => {
    clearEnv();
    expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws a clear error when the publishable key isn't configured", () => {
    clearEnv();
    expect(() => getSupabasePublishableKey()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("returns the real values once both are set", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
    expect(getSupabasePublishableKey()).toBe("sb_publishable_test");
  });

  it("strips a trailing slash from the URL -- a real mistake hit live during Story 6.1 setup, which otherwise produces a double slash once a path is appended and PostgREST rejects outright (PGRST125)", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co/";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });

  it("strips multiple trailing slashes", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co//";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });
});
