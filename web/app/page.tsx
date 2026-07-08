"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Home() {
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGenerate) return;

    const query = new URLSearchParams({ artist, song }).toString();
    router.push(`/loading?${query}`);
  }

  const canGenerate = artist.trim().length > 0 && song.trim().length > 0;

  return (
    <div className="hero-gradient flex min-h-screen flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">
          VocAligner
        </span>

        <h1 className="mt-6 max-w-2xl text-4xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-6xl">
          Recreate the vocal sound of your favourite artists.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
          Type an artist and a song, and VocAligner generates a Logic Pro
          stock plugin chain built to match their vocal sound.
        </p>

        <form
          onSubmit={handleGenerate}
          className="mt-12 flex w-full max-w-md flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="artist"
              className="text-xs font-medium tracking-wide text-muted uppercase"
            >
              Artist
            </label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
              placeholder="e.g. Frank Ocean"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none placeholder:text-zinc-400 focus:border-black/30"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="song"
              className="text-xs font-medium tracking-wide text-muted uppercase"
            >
              Song
            </label>
            <input
              id="song"
              type="text"
              value={song}
              onChange={(event) => setSong(event.target.value)}
              placeholder="e.g. Thinkin Bout You"
              className="rounded-lg border border-black/10 bg-white px-5 py-3 text-base text-foreground shadow-sm outline-none placeholder:text-zinc-400 focus:border-black/30"
            />
          </div>

          <button
            type="submit"
            disabled={!canGenerate}
            className="mt-2 rounded-lg px-8 py-3.5 text-lg font-semibold transition-colors enabled:bg-black enabled:text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-black/[.06] disabled:text-foreground/30"
          >
            Generate Vocal Chain
          </button>
        </form>

        <p className="mt-6 max-w-md text-sm text-supporting">
          Every chain uses only Logic Pro stock plugins — no third-party
          plugins required.
        </p>
      </main>
    </div>
  );
}
