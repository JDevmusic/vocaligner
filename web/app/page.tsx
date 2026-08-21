"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion, MotionConfig } from "motion/react";
import { BrandMark } from "./components/BrandMark";
import { AnimatedButton } from "./components/AnimatedButton";
import { MeetSection } from "./components/MeetSection";
import { ChainTeaserSection } from "./components/ChainTeaserSection";
import { Footer } from "./components/Footer";
import { CHAIN_PREVIEW } from "./landing-copy";
import { item } from "./components/motion-shared";

// Film-grain texture on the hero's large gradient area -- see
// docs/DESIGN_SYSTEM.md's Images/Texture note.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function Home() {
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  const canGenerate = artist.trim().length > 0 && song.trim().length > 0;

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    const query = new URLSearchParams({ artist, song }).toString();
    router.push(`/loading?${query}`);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <section
          className="relative flex min-h-screen flex-col"
          style={{
            background:
              "linear-gradient(180deg, var(--background) 0%, var(--sunset-fade) 14%, var(--sunset-start) 36%, var(--sunset-start) 58%, var(--wash-lavender) 80%, var(--wash-purple) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{ backgroundImage: GRAIN_URL }}
            aria-hidden="true"
          />

          <nav className="relative border-b border-foreground/[0.06]">
            <div className="mx-auto flex w-full max-w-[1200px] items-center px-6 py-7 sm:px-10">
              <BrandMark />
            </div>
          </nav>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-6 pt-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16"
          >
            <div>
              <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
                Signal research, matched to spec
              </span>
              <h1 className="mt-4 max-w-xl text-5xl leading-[1.03] font-semibold tracking-tight text-foreground sm:text-7xl">
                Recreate the vocal sound of your favourite artists.
              </h1>
            </div>

            <div className="lg:pt-2">
              <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
                What VocAligner does
              </span>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/75 sm:text-base">
                Every classic vocal has a recipe. VocAligner finds it and
                hands you the exact chain to recreate it — no trial and
                error, no third-party plugins.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={item}
            className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-14 text-center"
          >
            <form
              id="hero-form"
              onSubmit={handleGenerate}
              className="flex max-w-xl flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-xl leading-relaxed font-medium text-foreground sm:text-2xl"
            >
              <span>Match</span>
              <label className="sr-only" htmlFor="artist">Artist</label>
              <input
                id="artist"
                type="text"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                placeholder="Frank Ocean"
                size={12}
                className="min-w-0 border-b-2 border-foreground/30 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground"
              />
              <span>on</span>
              <label className="sr-only" htmlFor="song">Song</label>
              <input
                id="song"
                type="text"
                value={song}
                onChange={(event) => setSong(event.target.value)}
                placeholder="Thinkin Bout You"
                size={16}
                className="min-w-0 border-b-2 border-foreground/30 bg-transparent px-1 pb-0.5 text-center text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground"
              />
              <span>, in Logic Pro.</span>
            </form>

            <div className="mt-8">
              <AnimatedButton
                type="submit"
                form="hero-form"
                disabled={!canGenerate}
                title="Generate Vocal Chain"
                className="rounded-full bg-foreground px-8 py-3.5 text-base font-semibold text-background shadow-[0_6px_24px_-6px_color-mix(in_srgb,var(--wash-purple)_40%,transparent)] transition-shadow enabled:hover:shadow-[0_8px_30px_-4px_color-mix(in_srgb,var(--wash-purple)_55%,transparent)] disabled:cursor-not-allowed disabled:bg-foreground/[.06] disabled:text-foreground/30 disabled:shadow-none"
              >
                Generate Vocal Chain
              </AnimatedButton>
            </div>
          </motion.div>

          <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-10 text-center">
            <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-on-dark/65">
              {CHAIN_PREVIEW.map((plugin, index) => (
                <span key={plugin} className="flex items-center gap-3">
                  {plugin}
                  {index < CHAIN_PREVIEW.length - 1 ? (
                    <span className="text-on-dark/25" aria-hidden="true">·</span>
                  ) : null}
                </span>
              ))}
            </div>
          </footer>
        </section>

        <MeetSection />
        <ChainTeaserSection />
        <Footer />
      </div>
    </MotionConfig>
  );
}
