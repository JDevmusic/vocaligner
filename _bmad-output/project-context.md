---
project_name: 'VocAligner'
user_name: 'Pilki'
date: '2026-07-23'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 18
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Next.js 16.2.10 (App Router) — newer than most training data; `web/AGENTS.md` requires checking `node_modules/next/dist/docs/` before using an unfamiliar Next API or ignoring a deprecation notice
- React 19.2.4 / react-dom 19.2.4
- TypeScript 5, strict mode on
- Zod 4.4.3
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- Vitest 4.1.10
- ESLint 9 (flat config, `eslint-config-next`)
- `@anthropic-ai/sdk` 0.110.0
- Import alias: `@/*` → project root (`web/`)

## Critical Implementation Rules

### Language & Types

- Never hand-write a type that duplicates a Zod schema — always derive it with `z.infer<typeof schema>` (see `lib/schema/`)
- Custom error classes always set `this.name` explicitly in the constructor (see `lib/ai/errors.ts`)

### Next.js / React

- No global state library — state moves between pages via URL query params (e.g. `/loading?artist=&song=`), not context or a store
- `"use client"` only goes on pages/components that actually need interactivity
- API routes validate the body with `.safeParse` first, return `Response.json` with explicit status codes (400 = bad input, 502 = generation failed), and rethrow anything truly unexpected instead of swallowing it

### AI / Provider Layer

- Never call the Anthropic SDK directly from application code — always go through the `ModelClient` interface (`lib/ai/modelClient.ts`)
- Structured output is enforced with a forced `tool_choice` + a JSON schema generated from Zod via `z.toJSONSchema` — the model is never asked to free-text output that gets parsed
- **`getModelClient()` currently always returns the mock client.** The real Anthropic adapter (`anthropicModelClient.ts`, Phase 4a) exists but isn't wired in yet — don't assume live generation is active just because the adapter file is there
- Retry responsibility is split on purpose: transport-level errors (rate limits, network, 5xx) retry inside the Anthropic adapter; a malformed/missing structured response (`ModelResponseValidationError`) is never retried there — that's the orchestrator/stage's job, not the client's
- `ANTHROPIC_API_KEY` is server-only, read from `process.env` — never exposed to the client, never hardcoded

### Testing

- Tests are colocated (`foo.test.ts` next to `foo.ts`), not in a separate folder
- Vitest, `describe/it/expect` + `vi.fn()`
- Prefer injecting a fake via a constructor option (see `AnthropicModelClientOptions.client`) over mocking modules with `vi.mock()`

### Code Quality & Style

- Comments are rare — only for non-obvious "why", never "what"
- camelCase for `.ts` modules, PascalCase for React components

### Design System (condensed from `docs/DESIGN_SYSTEM.md`)

- Sunset-yellow-to-white gradient background (`hero-gradient` class), max content width ~1200px, generous whitespace
- Use the existing semantic color tokens (`text-foreground`, `text-muted`, `text-supporting`) — don't invent new colors
- Primary button = black bg/white text; animations subtle and fast only, no flashy/neon/DJ-style visuals

### Development Workflow (from `CLAUDE.md`)

- MVP scope only — no auth, payments, or premium features unless explicitly asked for
- Explain the plan and affected files before major structural changes, and wait for approval
- Never auto-commit; suggest a commit message at milestone end
- **Founder is new to day-to-day dev practice** — `.env.local`, `.gitignore`, env vars, and secrets handling aren't yet familiar territory. Any agent touching these should explain what/why in plain terms, be extra careful and explicit around anything secret-adjacent, and confirm before acting rather than assuming the convention is understood. See `CLAUDE.md`'s Communication section for the full note.

### Don't-Miss Rules

- Never create a second Next.js project or duplicate folders — always modify the existing `web/` app
- Callers never re-validate `ModelClient` output — the interface contract guarantees it already satisfies the schema
- `docs/MILESTONES.md` is currently stale (shows Phase 2–3 as pending though they're done) — cross-check against `git log`, don't trust its checkmarks blindly

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when the technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-07-23
