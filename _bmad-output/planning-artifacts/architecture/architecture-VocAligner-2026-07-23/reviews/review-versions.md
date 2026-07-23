---
name: 'Stack Version Verification'
type: architecture-review
purpose: verify-not-select
reviews: '../ARCHITECTURE-SPINE.md'
created: '2026-07-23'
method: 'web search + registry checks against web/package.json and installed node_modules, cross-checked against actual source usage'
---

# Review — Stack Table Version Verification

## Method

For each entry in the spine's Stack table, I:

1. Confirmed the version is actually installed (`web/node_modules/*/package.json`), not just declared in `web/package.json` — ruling out a hallucinated/aspirational version.
2. Web-searched the library's current release state as of 2026-07-23 (current date) to check the pinned version is real, current or near-current, and not deprecated/known-broken.
3. Checked for a documented reason the named pairings (Next 16 + React 19, Zod 4 + `z.toJSONSchema`, Zod + `@anthropic-ai/sdk`) are coherent rather than assumed.
4. Where the codebase already exercises an API (e.g. `z.toJSONSchema`), read the call site to confirm the usage matches the installed major version's actual API, not a stale mental model of an older major version.

**Overall verdict: the stack checks out.** Every version in the table is real, currently installed, and mutually coherent. Nothing is deprecated, silently broken, or mismatched. One adjacent, non-blocking item is worth a look (flagged below) — it's not a Stack table entry, but it surfaced while verifying the Anthropic SDK's actual call site.

## Per-Entry Findings

| Entry | Verdict | Notes |
| --- | --- | --- |
| Next.js 16.2.10 | ✅ OK | Confirmed on GitHub releases: 16.2.10 is a real, current patch release — a republish of `@next/swc-wasm-web` (accidentally unpublished since 16.2.4), no functional changes. Next 16 removed the Pages Router entirely and removed `next lint` / auto-lint-on-build; this repo's `package.json` `"lint": "eslint"` script and `eslint.config.mjs` (flat config via `eslint-config-next/core-web-vitals` + `/typescript`) already match this — i.e., the repo is *already* adapted to the Next 16 breaking change, not stuck on old tooling. |
| React 19.2.4 / react-dom 19.2.4 | ✅ OK, and notably the *patched* version | Confirmed real. Next.js 16's App Router is built for React 19.2 (View Transitions, `useEffectEvent`, Activity) — this is the documented, intended pairing, not a mismatch. React 19.2.4 specifically is a **security patch release** (Jan 26 2026) closing RSC/Server Actions DoS vulnerabilities disclosed in Dec 2025 that affected `react-server-dom-*` 19.0.0–19.2.2. The architecture is pinned to the fixed version, not a vulnerable one — worth noting as a positive, not a flag. |
| TypeScript 5.x (strict) | ✅ OK | Installed 5.9.3, a current stable 5.x release. No coherence concerns with Next 16 / React 19 / Zod 4. |
| Zod 4.4.3 | ✅ OK | Installed and current. Zod v4 (unlike v3) ships `z.toJSONSchema()` as a first-party API — no more need for the separate `zod-to-json-schema` package. Verified this isn't just a spine claim: `web/lib/ai/anthropicModelClient.ts:69` actually calls `z.toJSONSchema(schema)` to build the Anthropic tool's `input_schema`, confirming the codebase already uses the correct v4 API rather than a v3-era pattern. |
| @anthropic-ai/sdk 0.110.0 | ✅ OK | Confirmed as a real, recent SDK version (dependency-bump PRs across multiple public repos show 0.109.1→0.110.0 and 0.105.0→0.110.0 jumps at this exact version string — not a hallucinated number). Its `package.json` declares `peerDependencies: { zod: "^3.25.0 \|\| ^4.0.0" }`, which Zod 4.4.3 satisfies — the two are explicitly compatible, not just coincidentally similar-versioned. |
| Tailwind CSS 4.x | ✅ OK | Installed 4.3.2; latest at review time is 4.3.3 (released 2026-07-16) — one trivial patch behind, not a concern. `@tailwindcss/postcss` wiring is present and matches Tailwind v4's PostCSS-plugin architecture. |
| Vitest 4.1.10 | ✅ OK | Confirmed as a real current patch on the v4 line (released 2026-07-06, backporting two bug fixes). No conflicts with the rest of the toolchain. |
| ESLint 9.x (flat config) | ✅ OK | Installed 9.39.4. `eslint-config-next` is pinned to the same `16.2.10` as Next.js itself and defaults to flat config, matching ESLint 9's format (ESLint 10 will drop legacy config entirely, so this is also forward-positioned). The repo's actual `eslint.config.mjs` uses the flat-config import shape (`eslint-config-next/core-web-vitals`, `/typescript`) that the current `eslint-config-next` expects — confirmed by reading the file, not assumed. |

## Coherence Checks (cross-cutting)

- **Next.js 16 + React 19.2 pairing**: This is the documented, required pairing (Next 16's App Router uses React 19.2 features directly) — not an arbitrary combination that happens to both be "latest."
- **Zod 4 + `z.toJSONSchema` usage pattern implied by the architecture**: Directly confirmed in source, not inferred. The `ModelClient` port's Anthropic adapter converts every stage's Zod request schema to JSON Schema via the v4-native method, which is the correct, current way to do this (v3 required a third-party `zod-to-json-schema` package that is no longer part of the recommended pattern).
- **Zod 4 + `@anthropic-ai/sdk` 0.110.0**: The SDK's own peer-dependency range explicitly allows Zod 4, so this isn't just "both new packages that happen to coexist" — the SDK author declares compatibility.
- **ESLint 9 + `eslint-config-next` 16.2.10 + Next 16's removal of `next lint`**: The repo's own config and scripts already reflect the post-16 world (plain `eslint` invocation, flat config), which is exactly what upgrading to Next 16 requires — no leftover `.eslintrc`/legacy-config debt found.

## Secondary observation (not a Stack table entry, surfaced during verification)

While confirming the Zod/Anthropic SDK pairing, I read `web/lib/ai/anthropicModelClient.ts` and noticed its hardcoded `DEFAULT_MODEL` is `"claude-sonnet-4-5-20250929"` (Claude Sonnet 4.5) — an active but no-longer-current model; the newer `claude-sonnet-5` alias is now the recommended Sonnet-tier default and is on a different (adaptive-thinking-by-default) request surface. This is outside the Stack table's scope (it's an application-level model choice, not a package version) and not a "broken" pairing — Sonnet 4.5 still works — but it's an easy, low-risk thing to revisit before the live-Anthropic cutover mentioned in the spine's Deferred section, since it directly affects prompt/thinking behavior once wired via `getModelClient()`.

## Bottom line

Every version in the Stack table is real, currently installed, mutually compatible, and not deprecated or known-broken. This is coherent brownfield reality, not a stack that needs re-selecting. The one thing worth a second look is the hardcoded Anthropic model ID noted above — worth flagging as a conscious choice (or an update) before the live cutover, not before.
