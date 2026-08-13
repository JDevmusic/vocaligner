import { describe, expect, it, vi } from "vitest";
import { evaluateRateLimit, getClientIdentifier, type Limiter } from "./rateLimit";

function fakeLimiter(success: boolean, reset = 0): Limiter {
  return { limit: vi.fn().mockResolvedValue({ success, reset }) };
}

function rejectingLimiter(error: unknown): Limiter {
  return { limit: vi.fn().mockRejectedValue(error) };
}

describe("evaluateRateLimit", () => {
  it("allows the request when no limiter is configured (Upstash not set up)", async () => {
    const result = await evaluateRateLimit("1.2.3.4", null);
    expect(result).toEqual({ allowed: true });
  });

  it("allows the request when the limiter reports success", async () => {
    const limiter = fakeLimiter(true);
    const result = await evaluateRateLimit("1.2.3.4", limiter);
    expect(result).toEqual({ allowed: true });
    expect(limiter.limit).toHaveBeenCalledWith("1.2.3.4");
  });

  it("blocks the request and reports a positive retryAfterSeconds when the limiter rejects it", async () => {
    const resetAt = Date.now() + 45_000; // 45s in the future
    const limiter = fakeLimiter(false, resetAt);

    const result = await evaluateRateLimit("1.2.3.4", limiter);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(45);
  });

  it("never reports a negative retryAfterSeconds even if reset is already in the past", async () => {
    const limiter = fakeLimiter(false, Date.now() - 10_000);

    const result = await evaluateRateLimit("1.2.3.4", limiter);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("uses distinct identifiers independently -- passes the given identifier through, doesn't hardcode one", async () => {
    const limiter = fakeLimiter(true);
    await evaluateRateLimit("5.6.7.8", limiter);
    expect(limiter.limit).toHaveBeenCalledWith("5.6.7.8");
  });

  it("fails open (allows the request) when the limiter itself rejects -- e.g. a live Upstash outage, distinct from 'not configured'", async () => {
    const warnSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const limiter = rejectingLimiter(new Error("ECONNRESET"));

    const result = await evaluateRateLimit("1.2.3.4", limiter);

    expect(result).toEqual({ allowed: true });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

describe("getClientIdentifier", () => {
  function requestWithHeader(value: string | null): Request {
    const headers = new Headers();
    if (value !== null) headers.set("x-forwarded-for", value);
    return new Request("http://localhost/api/generate", { headers });
  }

  it("returns the single IP when the header has exactly one", () => {
    expect(getClientIdentifier(requestWithHeader("203.0.113.7"))).toBe("203.0.113.7");
  });

  it("returns the first IP in a comma-separated chain (the original client, not a proxy)", () => {
    expect(getClientIdentifier(requestWithHeader("203.0.113.7, 10.0.0.1, 10.0.0.2"))).toBe("203.0.113.7");
  });

  it("trims whitespace around the first entry", () => {
    expect(getClientIdentifier(requestWithHeader("  203.0.113.7  ,10.0.0.1"))).toBe("203.0.113.7");
  });

  it("returns null when the header is missing", () => {
    expect(getClientIdentifier(requestWithHeader(null))).toBeNull();
  });

  it("returns null when the header is present but empty", () => {
    expect(getClientIdentifier(requestWithHeader(""))).toBeNull();
  });

  it("skips a leading empty segment instead of treating it as a missing identifier", () => {
    expect(getClientIdentifier(requestWithHeader(",203.0.113.7"))).toBe("203.0.113.7");
  });

  it("skips leading whitespace-only segments", () => {
    expect(getClientIdentifier(requestWithHeader("  ,203.0.113.7"))).toBe("203.0.113.7");
  });

  it("returns null when every segment is empty", () => {
    expect(getClientIdentifier(requestWithHeader(",,"))).toBeNull();
  });
});
