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
});
