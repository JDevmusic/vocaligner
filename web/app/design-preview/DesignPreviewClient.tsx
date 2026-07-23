"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Wordmark } from "../components/Wordmark";
import { CHAIN_PREVIEW, HOW_IT_WORKS } from "../landing-copy";

// Throwaway design-exploration page. Delete after a direction is picked.
// Bricolage Grotesque is loaded as --font-display by the parent server
// component (page.tsx) — reference it via this Tailwind arbitrary utility.
const DISPLAY = "font-[family-name:var(--font-display)]";

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const springTap = { type: "spring" as const, stiffness: 420, damping: 24 };

export function DesignPreviewClient() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <style>{"html { scroll-behavior: smooth; }"}</style>
      <PreviewSwitcher />
      <DesignA />
      <DesignB />
      <DesignC />
    </div>
  );
}

function PreviewSwitcher() {
  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="sticky top-0 z-50 flex items-center justify-center gap-6 border-b border-black/10 bg-white/90 py-2.5 text-xs font-medium text-zinc-500 backdrop-blur"
    >
      <span className="text-zinc-400">Design preview — jump to:</span>
      <Link href="#design-a" className="transition-colors hover:text-black">A · Sunset Editorial</Link>
      <Link href="#design-b" className="transition-colors hover:text-black">B · Studio Console</Link>
      <Link href="#design-c" className="transition-colors hover:text-black">C · Minimal Focus</Link>
    </motion.div>
  );
}

function SectionLabel({ letter, name }: { letter: string; name: string }) {
  return (
    <div className="sticky top-10 z-10 px-4 pt-4 sm:px-6 sm:pt-6">
      <span className="inline-block rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
        Design {letter} — {name}
      </span>
    </div>
  );
}

function AnimatedButton({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className: string;
  title: string;
}) {
  return (
    <motion.button
      type="button"
      title={title}
      variants={item}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.96 }}
      transition={springTap}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Design A — "Sunset Editorial"
// A refined take on the current direction: full sunset gradient, large
// centered type, tightened rhythm, kinetic entrance on scroll.
// ---------------------------------------------------------------------------

function DesignA() {
  return (
    <section id="design-a" className="hero-gradient relative flex min-h-screen flex-col">
      <SectionLabel letter="A" name="Sunset Editorial" />
      <motion.main
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-16 text-center sm:py-20"
      >
        <motion.div variants={item}>
          <Wordmark />
        </motion.div>

        <motion.h1
          variants={item}
          className={`${DISPLAY} mt-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-foreground sm:text-7xl`}
        >
          Recreate the vocal sound of your favourite artists.
        </motion.h1>

        <motion.p variants={item} className="mt-4 max-w-xl text-lg text-muted sm:text-xl">
          Type an artist and a song. VocAligner generates a Logic Pro stock
          plugin chain built to match their vocal sound.
        </motion.p>

        <motion.form variants={item} className="mt-8 flex w-full max-w-md flex-col gap-3">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="artist-a" className="text-xs font-medium tracking-wide text-muted uppercase">
              Artist
            </label>
            <input
              id="artist-a"
              type="text"
              placeholder="e.g. Frank Ocean"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-black/30 focus:shadow-md"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="song-a" className="text-xs font-medium tracking-wide text-muted uppercase">
              Song
            </label>
            <input
              id="song-a"
              type="text"
              placeholder="e.g. Thinkin Bout You"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-black/30 focus:shadow-md"
            />
          </div>
          <AnimatedButton
            title="Preview only — not wired up"
            className="mt-1 rounded-lg bg-black px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Generate Vocal Chain
          </AnimatedButton>
        </motion.form>

        <motion.p variants={item} className="mt-4 max-w-md text-sm text-supporting">
          Every chain uses only Logic Pro stock plugins — no third-party
          plugins required.
        </motion.p>

        <motion.div
          variants={container}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {CHAIN_PREVIEW.map((plugin, index) => (
            <motion.div key={plugin} variants={item} className="flex items-center gap-2">
              <motion.span
                whileHover={{ y: -2 }}
                transition={springTap}
                className="rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-sm font-medium text-supporting shadow-sm"
              >
                {plugin}
              </motion.span>
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-muted/50" aria-hidden="true">→</span>
              ) : null}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={container}
          className="mt-16 grid w-full grid-cols-1 gap-8 border-t border-black/5 pt-10 sm:grid-cols-3"
        >
          {HOW_IT_WORKS.map((step, index) => (
            <motion.div key={step.title} variants={item} className="flex flex-col items-center text-center">
              <span className={`${DISPLAY} flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white`}>
                {index + 1}
              </span>
              <h2 className="mt-3 text-base font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Design B — "Studio Console"
// Linear / Raycast inspired: mostly white, structured top nav, asymmetric
// split hero with a channel-strip visual that idles with a slow float.
// ---------------------------------------------------------------------------

function DesignB() {
  return (
    <section id="design-b" className="relative flex min-h-screen flex-col bg-white">
      <SectionLabel letter="B" name="Studio Console" />

      <nav className="border-b border-black/5">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4 sm:px-10">
          <Wordmark />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted sm:flex">
            <span>Product</span>
            <span>How it works</span>
          </div>
        </div>
      </nav>

      <motion.main
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-0"
      >
        <div className="flex flex-col">
          <motion.span
            variants={item}
            className="text-xs font-semibold tracking-[0.25em] text-accent uppercase"
          >
            AI Vocal Chains for Logic Pro
          </motion.span>

          <motion.h1
            variants={item}
            className={`${DISPLAY} mt-4 max-w-lg text-4xl leading-[1.02] font-semibold tracking-tight text-foreground sm:text-5xl`}
          >
            Match the sound.
            <br />
            Skip the guesswork.
          </motion.h1>

          <motion.p variants={item} className="mt-4 max-w-md text-base text-muted sm:text-lg">
            VocAligner researches the production behind a track and hands you
            a stock Logic Pro plugin chain built to match it.
          </motion.p>

          <motion.form
            variants={item}
            className="mt-7 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1 px-2 pt-1.5">
              <label htmlFor="artist-b" className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Artist
              </label>
              <input
                id="artist-b"
                type="text"
                placeholder="Frank Ocean"
                className="border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
            </div>
            <div className="hidden h-8 w-px bg-black/10 sm:block" />
            <div className="flex flex-1 flex-col gap-1 px-2 pt-1.5">
              <label htmlFor="song-b" className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Song
              </label>
              <input
                id="song-b"
                type="text"
                placeholder="Thinkin Bout You"
                className="border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-zinc-400"
              />
            </div>
            <AnimatedButton
              title="Preview only — not wired up"
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Generate
            </AnimatedButton>
          </motion.form>

          <motion.p variants={item} className="mt-3 text-xs text-supporting">
            Logic Pro stock plugins only — nothing third-party to buy.
          </motion.p>

          <motion.div
            variants={container}
            className="mt-10 grid grid-cols-3 gap-6 border-t border-black/5 pt-8"
          >
            {HOW_IT_WORKS.map((step, index) => (
              <motion.div key={step.title} variants={item}>
                <span className={`${DISPLAY} font-mono text-xs text-muted`}>0{index + 1}</span>
                <h2 className="mt-1.5 text-sm font-semibold text-foreground">{step.title}</h2>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div variants={item} className="relative flex items-center justify-center py-6 lg:py-0">
          <div
            className="absolute h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--sunset-start) 0%, var(--sunset-fade) 60%, transparent 80%)",
            }}
            aria-hidden="true"
          />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white/90 p-5 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                Channel Strip
              </span>
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-3 flex flex-col gap-2"
            >
              {CHAIN_PREVIEW.map((plugin) => (
                <motion.div
                  key={plugin}
                  variants={item}
                  whileHover={{ x: 3 }}
                  transition={springTap}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-zinc-50 px-4 py-3"
                >
                  <span className="font-mono text-sm text-foreground">{plugin}</span>
                  <div className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.main>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Design C — "Minimal Focus"
// ElevenLabs / Notion inspired: almost entirely white, tiny nav, vertically
// centered content, the artist/song input is the visual hero.
// ---------------------------------------------------------------------------

function DesignC() {
  return (
    <section id="design-c" className="relative flex min-h-screen flex-col bg-white">
      <SectionLabel letter="C" name="Minimal Focus" />

      <div
        className="absolute inset-x-0 top-0 h-[380px]"
        style={{
          background: "linear-gradient(to bottom, var(--sunset-fade) 0%, transparent 100%)",
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      <header className="relative mx-auto w-full max-w-[1200px] px-6 pt-8 text-center">
        <Link
          href="/"
          className="text-xs font-semibold tracking-[0.3em] text-muted uppercase transition-opacity hover:opacity-70"
        >
          VocAligner
        </Link>
      </header>

      <motion.main
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      >
        <motion.h1
          variants={item}
          className={`${DISPLAY} max-w-2xl text-3xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-4xl`}
        >
          Recreate the vocal sound of your favourite artists.
        </motion.h1>

        <motion.div
          variants={item}
          whileHover={{ scale: 1.01 }}
          transition={springTap}
          className="mt-8 flex w-full max-w-2xl flex-col overflow-hidden rounded-full border border-black/10 bg-white shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 flex-col gap-0.5 px-7 py-3.5 text-left">
            <label htmlFor="artist-c" className="text-[10px] font-medium tracking-wide text-muted uppercase">
              Artist
            </label>
            <input
              id="artist-c"
              type="text"
              placeholder="Frank Ocean"
              className="border-none bg-transparent p-0 text-base text-foreground outline-none placeholder:text-zinc-400"
            />
          </div>
          <div className="hidden h-8 w-px bg-black/10 sm:block" />
          <div className="flex flex-1 flex-col gap-0.5 px-7 py-3.5 text-left">
            <label htmlFor="song-c" className="text-[10px] font-medium tracking-wide text-muted uppercase">
              Song
            </label>
            <input
              id="song-c"
              type="text"
              placeholder="Thinkin Bout You"
              className="border-none bg-transparent p-0 text-base text-foreground outline-none placeholder:text-zinc-400"
            />
          </div>
          <AnimatedButton
            title="Preview only — not wired up"
            className="m-1.5 shrink-0 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Generate
          </AnimatedButton>
        </motion.div>

        <motion.p variants={item} className="mt-4 max-w-sm text-sm text-supporting">
          Logic Pro stock plugins only. No account, no upload — just an
          artist and a song.
        </motion.p>
      </motion.main>

      <motion.footer
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative mx-auto w-full max-w-[1200px] px-6 pb-12 text-center"
      >
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
          {CHAIN_PREVIEW.map((plugin, index) => (
            <motion.span key={plugin} variants={item} className="flex items-center gap-3">
              {plugin}
              {index < CHAIN_PREVIEW.length - 1 ? (
                <span className="text-muted/40" aria-hidden="true">·</span>
              ) : null}
            </motion.span>
          ))}
        </div>
      </motion.footer>
    </section>
  );
}
