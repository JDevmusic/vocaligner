

Reference screenshots
Control names
Which controls usually change
Which controls almost never change
Default values
Valid ranges
Educational text
React component requirements

compressor.png
![Compressor_plug-in](<Screenshot 2026-07-26 at 16.56.06.png>)

channel-eq.png
![ChannelEQ_plug-in](<Screenshot 2026-07-26 at 16.55.20.png>)

deesser.png
![Desser_plug-in](<Screenshot 2026-07-26 at 16.57.20.png>)

chromaverb.png
![Chromaverb_plug-in](<Screenshot 2026-07-26 at 16.56.32.png>)


Pitch_correction.png
![pitch_correction_plu-in](<Screenshot 2026-07-26 at 16.57.53.png>)

tape-delay.png
![Tape_delay_plug-in](<Screenshot 2026-07-26 at 16.58.22.png>)

Overdive.png
![Overdrive_plug-in](<Screenshot 2026-07-26 at 16.58.47.png>)


Flanger.png
![Flanger_plug-in](<Screenshot 2026-07-26 at 16.59.14.png>)

Chorus.png
![Chorus_plug-in](<Screenshot 2026-07-26 at 16.59.30.png>)

Phaser.png
![Phaser_plug-in](<Screenshot 2026-07-26 at 16.59.46.png>)

---

## Pitch Correction — Root Note + Scale/Chord interval patterns

The keyboard must highlight notes computed from Root Note + Scale/Chord, not
hand-listed per combination. Each scale/chord below is a set of semitone
offsets from the root (0 = root itself); apply by transposing onto whichever
root note comes back from research. E.g. Root G + Major [0,2,4,5,7,9,11] →
G, A, B, C, D, E, F#.

Root notes map to semitone index 0-11: C=0, C#/Db=1, D=2, D#/Eb=3, E=4, F=5,
F#/Gb=6, G=7, G#/Ab=8, A=9, A#/Bb=10, B=11. Root Note "None" → no highlighting
(shouldn't come up in practice, since research always resolves a specific key).

| Scale/Chord | Semitone offsets from root |
|---|---|
| Chromatic Scale | 0,1,2,3,4,5,6,7,8,9,10,11 |
| Major Scale | 0,2,4,5,7,9,11 |
| Major Pentatonic Scale | 0,2,4,7,9 |
| Minor Pentatonic Scale | 0,3,5,7,10 |
| Major + b7 Scale (Mixolydian) | 0,2,4,5,7,9,10 |
| Natural Minor Scale (Aeolian) | 0,2,3,5,7,8,10 |
| Harmonic Minor Scale | 0,2,3,5,7,8,11 |
| Melodic Minor Scale | 0,2,3,5,7,9,11 |
| Major Chord | 0,4,7 |
| 6 | 0,4,7,9 |
| 6/9 | 0,2,4,7,9 |
| 7 | 0,4,7,10 |
| 7sus4 | 0,5,7,10 |
| 7/b5 | 0,4,6,10 |
| 7/b9 | 0,1,4,7,10 |
| 7/9 | 0,2,4,7,10 |
| 7/#9 | 0,3,4,7,10 |
| 7/#11 | 0,4,6,7,10 |
| 7/b13 | 0,4,7,8,10 |
| 7/13 | 0,4,7,9,10 |
| Maj7 | 0,4,7,11 |
| Maj7/9 | 0,2,4,7,11 |
| Maj7/#11 | 0,4,6,7,11 |
| Add9 | 0,2,4,7 |
| Min | 0,3,7 |
| Min6 | 0,3,7,9 |
| Min7 | 0,3,7,10 |
| Min7/b5 | 0,3,6,10 |
| Min7/9 | 0,2,3,7,10 |
| Min7/11 | 0,3,5,7,10 |
| Min/maj7 | 0,3,7,11 |
| Min/maj7/9 | 0,2,3,7,11 |
| Min add9 | 0,2,3,7 |
| Dim | 0,3,6 |
| Dim7 | 0,3,6,9 |
| Aug | 0,4,8 |
| Aug7 | 0,4,8,10 |
| Aug j7 | 0,4,8,11 |
| Sus2 | 0,2,7 |
| Sus4 | 0,5,7 |
| Drone | 0,7 (root + a fifth — confirmed via Apple's Logic Pro documentation: "the drone scale uses a fifth as a quantization grid") |
| Single | 0 (root only — confirmed via Apple's Logic Pro documentation: "the single scale defines a single note") |

Drone and Single are Logic-specific quantization concepts (not standard scale
theory) but are now confirmed against Apple's official documentation rather
than assumed: [Pitch Correction quantization in Logic Pro for Mac](https://support.apple.com/guide/logicpro/quantization-grid-lgcef2835611/mac).
Drone was NOT root-only as originally guessed — it includes the fifth.

---

## Channel EQ — real 8-band structure and default values

Real Channel EQ is 8 bands, not the 4 flat knobs currently in
`web/lib/registry/logicPro.ts` — extend the registry entry to match before
building the bespoke visual (Story 1.3, Task 2). Each band has Frequency (Hz),
Gain (dB), and Q — except bands 1 and 8, which use a Slope (dB/Octave: 12 or
24) instead of Q.

Default values, read directly from a neutral-state Logic screenshot
(`docs/images.md/ChannelEQ_plugin.png`, "Original Audio" — every band grayed
out, curve dead flat at 0dB):

| Band | Frequency | Gain | Slope / Q | Type |
|---|---|---|---|---|
| 1 | 20.0 Hz | 0.0 dB | 12 dB/Oct | low cut |
| 2 | 75.0 Hz | 0.0 dB | Q 1.00 | low shelf |
| 3 | 100 Hz | 0.0 dB | Q 0.60 | bell |
| 4 | 250 Hz | 0.0 dB | Q 0.30 | bell |
| 5 | 1040 Hz | 0.0 dB | Q 0.41 | bell |
| 6 | 2500 Hz | 0.0 dB | Q 0.20 | bell |
| 7 | 7500 Hz | 0.0 dB | Q 1.00 | high shelf |
| 8 | 20000 Hz | 0.0 dB | 24 dB/Oct | high cut |

Master output Gain: 0.0 dB.

**A band absent from a `PluginInstance`'s `controls[]` array must contribute
zero to the rendered curve** — never fall back to computing its filter
response at the default frequency above. This is not a styling detail: in
`docs/images.md/ChannelEQ_example.png` (a real applied example), only 3 of
the 8 bands actually differ from their defaults (Band 1 freq → 69.5 Hz, Band 4
gain → −4.4 dB, Band 6 freq/gain/Q → 2980 Hz / +1.5 dB / Q 0.93, Band 8 freq →
12000 Hz) — the other bands are genuinely untouched, and the curve must be
dead flat wherever that's true, matching the neutral reference exactly. Build
a neutral-state diagnostic (all bands at/absent their defaults) and confirm
it's flat before verifying against applied data — this is what caught the
original implementation computing a rolloff shape at rest.

The curve is real filter-response math (biquad/RBJ Cookbook formulas per band
type), computed client-side and deterministically from whatever band data the
Generation produced — not an AI output, not an approximation.

See `docs/DESIGN_SYSTEM.md`'s Plugin Visual Fidelity Standards for the
resulting visual calibration rules (0dB-relative shading, dual-scale axis,
frequency-label density/collision handling) validated against these two
reference images through several rounds of static mockups before any
component code was written.