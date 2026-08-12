import { describe, expect, it, vi } from "vitest";
import { createFailoverModelClient } from "./failoverModelClient";
import { ModelResponseValidationError, ModelTransportError } from "./errors";
import type { GenerateStructuredResult, ModelClient } from "./modelClient";

function fakeResult<T>(data: T): GenerateStructuredResult<T> {
  return { data, usage: { inputTokens: 1, outputTokens: 1 }, retryCount: 0 };
}

function fakeClient(modelId: string): ModelClient {
  return { modelId, generateStructured: vi.fn() };
}

describe("createFailoverModelClient", () => {
  it("returns the primary's result and reports the primary's modelId when the primary succeeds", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockResolvedValue(fakeResult({ ok: true }));

    const client = createFailoverModelClient({ primary, fallback });
    const result = await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });

    expect(result.data).toEqual({ ok: true });
    expect(client.modelId).toBe("primary");
    expect(fallback.generateStructured).not.toHaveBeenCalled();
  });

  it("falls over to the fallback and reports its modelId when the primary throws ModelTransportError", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelTransportError("primary is down"));
    vi.mocked(fallback.generateStructured).mockResolvedValue(fakeResult({ ok: "from fallback" }));

    const client = createFailoverModelClient({ primary, fallback });
    const result = await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });

    expect(result.data).toEqual({ ok: "from fallback" });
    expect(client.modelId).toBe("fallback");
  });

  it("does not fail over on a ModelResponseValidationError -- that's the per-stage retry's job, not the transport layer's", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelResponseValidationError("bad shape"));

    const client = createFailoverModelClient({ primary, fallback });

    await expect(client.generateStructured({ schema: {} as never, system: "s", prompt: "p" })).rejects.toBeInstanceOf(
      ModelResponseValidationError
    );
    expect(fallback.generateStructured).not.toHaveBeenCalled();
  });

  it("propagates an unrecognized error type without touching the fallback", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new Error("something unrelated"));

    const client = createFailoverModelClient({ primary, fallback });

    await expect(client.generateStructured({ schema: {} as never, system: "s", prompt: "p" })).rejects.toThrow(
      "something unrelated"
    );
    expect(fallback.generateStructured).not.toHaveBeenCalled();
  });

  it("is sticky within one generation: once failed over, later calls go straight to the fallback without re-trying the primary", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelTransportError("primary is down"));
    vi.mocked(fallback.generateStructured).mockResolvedValue(fakeResult({ ok: true }));

    const client = createFailoverModelClient({ primary, fallback });
    await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });
    await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });

    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
    expect(fallback.generateStructured).toHaveBeenCalledTimes(2);
  });

  it("logs a visible warning (with no key material) when it fails over", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelTransportError("primary is down"));
    vi.mocked(fallback.generateStructured).mockResolvedValue(fakeResult({ ok: true }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const client = createFailoverModelClient({ primary, fallback });
    await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain("primary");
    expect(message).toContain("fallback");
    expect(message).not.toMatch(/sk-|Bearer |api[_-]?key/i);

    warnSpy.mockRestore();
  });

  it("folds the primary's failure into the thrown error when the fallback also throws a ModelTransportError", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelTransportError("primary is down"));
    vi.mocked(fallback.generateStructured).mockRejectedValue(new ModelTransportError("fallback is down too"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const client = createFailoverModelClient({ primary, fallback });
    const call = client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });

    await expect(call).rejects.toBeInstanceOf(ModelTransportError);
    await expect(call).rejects.toThrow(/primary is down/i);
    await expect(call).rejects.toThrow(/fallback is down too/i);

    // Still sticky to the fallback afterward -- no point re-trying a confirmed-down primary
    // just because the fallback also failed once.
    vi.mocked(fallback.generateStructured).mockResolvedValue(fakeResult({ ok: true }));
    await client.generateStructured({ schema: {} as never, system: "s", prompt: "p" });
    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
  });

  it("propagates the fallback's ModelResponseValidationError as-is (not wrapped) so the per-stage retry can still recognize it", async () => {
    const primary = fakeClient("primary");
    const fallback = fakeClient("fallback");
    vi.mocked(primary.generateStructured).mockRejectedValue(new ModelTransportError("primary is down"));
    vi.mocked(fallback.generateStructured).mockRejectedValue(new ModelResponseValidationError("fallback returned junk"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const client = createFailoverModelClient({ primary, fallback });

    await expect(client.generateStructured({ schema: {} as never, system: "s", prompt: "p" })).rejects.toBeInstanceOf(
      ModelResponseValidationError
    );
  });
});
