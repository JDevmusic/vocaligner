"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion, MotionConfig } from "motion/react";
import { BrandMark } from "./components/BrandMark";
import { AnimatedButton } from "./components/AnimatedButton";
import { AutocompleteInput } from "./components/AutocompleteInput";
import { MeetSection } from "./components/MeetSection";
import { ChainTeaserSection } from "./components/ChainTeaserSection";
import { Footer } from "./components/Footer";
import { CHAIN_PREVIEW } from "./landing-copy";
import { item } from "./components/motion-shared";
import { fetchArtistSuggestions, fetchSongSuggestions } from "@/lib/api/suggestClient";

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
              "linear-gradient(180deg, var(--wash-purple) 0%, var(--wash-purple-deep) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{ backgroundImage: GRAIN_URL }}
            aria-hidden="true"
          />

          <nav className="relative border-b border-on-dark/10">
            <div className="mx-auto flex w-full max-w-[1200px] items-center px-6 py-7 sm:px-10">
              <BrandMark className="text-on-dark" />
            </div>
          </nav>

          <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={item}
              className="w-full max-w-4xl rounded-[2rem] px-8 py-14 text-center shadow-[0_30px_80px_-20px_color-mix(in_srgb,var(--wash-purple-deep)_75%,transparent)] sm:px-16 sm:py-20"
              style={{ background: "var(--hero-panel)" }}
            >
              <span className="font-mono text-xs tracking-[0.2em] text-supporting uppercase">
                Signal research, matched to spec
              </span>
              <h1 className="mx-auto mt-4 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-6xl">
                Recreate the vocal sound of your favourite artists.
              </h1>

              <span className="mt-10 block text-xl font-semibold text-foreground sm:text-2xl">
                See For Yourself
              </span>

              <form
                id="hero-form"
                onSubmit={handleGenerate}
                className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center"
              >
                <div className="flex w-full flex-col gap-1.5 text-left sm:w-auto">
                  <label
                    htmlFor="artist"
                    className="font-mono text-xs tracking-[0.2em] text-supporting uppercase"
                  >
                    Artist
                  </label>
                  <AutocompleteInput
                    id="artist"
                    value={artist}
                    onChange={setArtist}
                    fetchSuggestions={fetchArtistSuggestions}
                    placeholder="Frank Ocean"
                    className="w-full min-w-0 rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground sm:w-56"
                  />
                </div>
                <div className="flex w-full flex-col gap-1.5 text-left sm:w-auto">
                  <label
                    htmlFor="song"
                    className="font-mono text-xs tracking-[0.2em] text-supporting uppercase"
                  >
                    Song
                  </label>
                  <AutocompleteInput
                    id="song"
                    value={song}
                    onChange={setSong}
                    fetchSuggestions={(query) => fetchSongSuggestions(artist, query)}
                    minChars={1}
                    placeholder="Thinkin Bout You"
                    className="w-full min-w-0 rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground sm:w-56"
                  />
                </div>
              </form>

              <div className="mt-8">
                <AnimatedButton
                  type="submit"
                  form="hero-form"
                  disabled={!canGenerate}
                  title="Generate Vocal Chain"
                  className="rounded-full bg-brand-accent px-8 py-3.5 text-base font-semibold text-foreground shadow-[0_6px_24px_-6px_color-mix(in_srgb,var(--wash-purple-deep)_40%,transparent)] transition-shadow enabled:hover:shadow-[0_8px_30px_-4px_color-mix(in_srgb,var(--wash-purple-deep)_55%,transparent)] disabled:cursor-not-allowed disabled:bg-foreground/[.06] disabled:text-foreground/30 disabled:shadow-none"
                >
                  Generate Vocal Chain
                </AnimatedButton>
              </div>
            </motion.div>
          </div>

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
