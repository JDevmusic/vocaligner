import { afterEach, describe, expect, it, vi } from "vitest";

// Isolated from route.test.ts's other cases (which need real rate-limit/generation
// behavior) so mocking checkRateLimit here can't affect them -- vi.mock is module-wide
// for whichever test file it's declared in.
vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rateLimit")>();
  return { ...actual, checkRateLimit: vi.fn() };
});
vi.mock("@/lib/ai/generateVocalChain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/generateVocalChain")>();
  return { ...actual, generateVocalChain: vi.fn() };
});

const { checkRateLimit } = await import("@/lib/rateLimit");
const { generateVocalChain } = await import("@/lib/ai/generateVocalChain");
const { POST } = await import("./route");

// Minimal fake shape -- just enough for saveGeneration()'s field access
// (id/input.artist/input.song) not to throw. Used by tests where generation proceeds
// (rate limiting allowed it, or was skipped) but the response's own shape isn't what's
// being asserted on.
const FAKE_GENERATION = {
  id: "fake-id",
  input: { artist: "Frank Ocean", song: "Thinkin Bout You" },
  meta: {
    generatedAt: "2026-01-01T00:00:00.000Z",
    model: "fake",
    pipelineVersion: "0",
    promptVersion: "0",
    schemaVersion: "0",
    cacheHit: false,
  },
  research: {} as never,
  reasoning: {} as never,
  chain: { daw: "logic-pro" as const, registryContext: { tier: "stock" as const }, plugins: [] },
  validation: { status: "valid" as const, issues: [] },
};

function postGenerate(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/generate -- rate limiting (AC 1, Epic 5 Story 5.1)", () => {
  afterEach(() => {
    vi.mocked(checkRateLimit).mockReset();
    vi.mocked(generateVocalChain).mockReset();
  });

  it("returns 429 with a Retry-After header and never calls generateVocalChain (zero AI cost) when blocked", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    const response = await postGenerate(
      { artist: "Frank Ocean", song: "Thinkin Bout You" },
      { "x-forwarded-for": "203.0.113.7" }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(generateVocalChain).not.toHaveBeenCalled();
    expect(checkRateLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("has no Retry-After header when the block result doesn't include one", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false });

    const response = await postGenerate(
      { artist: "Frank Ocean", song: "Thinkin Bout You" },
      { "x-forwarded-for": "203.0.113.7" }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeNull();
  });

  it("proceeds to a real generation when the rate limit allows it", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(generateVocalChain).mockResolvedValue(FAKE_GENERATION);

    const response = await postGenerate(
      { artist: "Frank Ocean", song: "Thinkin Bout You" },
      { "x-forwarded-for": "203.0.113.7" }
    );

    expect(checkRateLimit).toHaveBeenCalledWith("203.0.113.7");
    expect(generateVocalChain).toHaveBeenCalled();
    expect(response.status).not.toBe(429);
  });

  it("skips the rate-limit check entirely (never calls checkRateLimit) when no x-forwarded-for header is present", async () => {
    // Rate limiting being skipped doesn't stop the rest of the request -- generation still
    // proceeds, so this needs the same fake resolved value as above to avoid
    // saveGeneration() crashing on an unmocked (undefined) response.
    vi.mocked(generateVocalChain).mockResolvedValue(FAKE_GENERATION);

    await postGenerate({ artist: "Frank Ocean", song: "Thinkin Bout You" });

    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
