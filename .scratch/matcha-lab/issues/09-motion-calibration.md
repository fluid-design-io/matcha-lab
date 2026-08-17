# Motion calibration

Type: prototype
Status: **awaiting the human**
Blocked by: 07

## Prototype

**`/prototypes/motion`** — run `bun run dev` and open
[http://localhost:3000/prototypes/motion](http://localhost:3000/prototypes/motion) at 1366×1024.

Four intensities of the same staggered dissolve, **driven by one trigger**. That is the whole
design of the prototype: four simultaneous responses to a single change is the only way to judge
relative intensity — flipping between them one at a time measures memory, not motion. Arrow keys,
space, or the Prev/Next buttons step; jumping several places along the rail shows whether a long
jump should differ from a single step.

Each panel is the real landscape composition at its measured positions, with the real renders,
scaled with CSS `zoom` rather than `transform: scale` so the px travel distances shrink in the
same proportion as everything else. A transform would keep text crisper but make a 20px drift look
like 20px at half size, which is the one thing this prototype must not misrepresent.

| | Candidate | Stagger | Layer spring | Drift | Watermark |
| --- | --- | --- | --- | --- | --- |
| **A** | Opacity only | 30 ms | 0.34 s, bounce 0 | 0 px | 0.9 s, 0 px |
| **B** | A whisper of travel | 40 ms | 0.38 s, bounce 0 | 4 px | 1.0 s, 9 px |
| **C** | Legible depth | 55 ms | 0.44 s, bounce 0 | 9 px | 1.2 s, 20 px |
| **D** | Too much, on purpose | 85 ms | 0.58 s, bounce 0.16 | 20 px | 1.7 s, 42 px |

D exists to bracket the range rather than to win. You cannot judge "too subtle" without seeing
"too much" beside it, and three quiet candidates just move the question.

Layer order is `title → romaji → detail → render → rail → watermark`, each lagging the one before
by `stagger`, with the watermark on its own slower spring — depth without 3D.

## Blocked on

**A human has to pick.** Ticket says so, and it is right: *"so subtle that only someone paying
close attention notices it"* is a taste judgement that cannot be settled by reasoning about
numbers.

Also still open, and best answered while watching it:

- Should a **multi-step jump** differ from a single step?
- Is the **watermark's** slower spring doing the work, or should it simply not move at all?

Once picked, the numbers go into `src/lib/motion.ts` (which currently holds candidate C as a
placeholder, marked `CALIBRATION PENDING`) and into `DESIGN-TASTE.md` § Motion, and the pending
notes get deleted. `MOTION_REDUCED` there already answers the `prefers-reduced-motion` half: a
single 120 ms cross-fade, no stagger, no travel — every state change still reads, it just stops
travelling.

## Environment note, which cost real time

**Motion cannot be verified in the in-app browser pane.** It reports `document.hidden` permanently
and delivers **zero `requestAnimationFrame` frames per second**, so Motion's frameloop never runs:
`initial` styles apply on mount, `animate` never progresses, exits never complete, and the
outgoing layers pile up in the DOM instead of unmounting. That looks exactly like an
`AnimatePresence` bug and is not one.

The same limitation blocks the WebGPU field canvas — see
[The living matcha field](./06-matcha-field.md). Anything frame-driven has to be checked in a real
browser window.

One real bug was found and fixed on the way, unrelated to the above: Vite's dep-optimizer cache
served a second React copy the first time `motion/react` was imported, which threw "Invalid hook
call". Clearing `node_modules/.vite` fixed it; `resolve.dedupe` and `optimizeDeps.include` are now
set so it cannot recur.

## Question

Find the right intensity for the drink-change transition, then write the winning values into `DESIGN-TASTE.md` as motion tokens.

This is a **prototype ticket, human in the loop** — "so subtle that only someone paying close attention notices it" is a taste judgement that cannot be settled by reasoning about numbers. Build the transition at three or four intensities, put them side by side at 1366×1024, and have the human pick. Do not answer this one alone.

The shape is settled: a **staggered dissolve**. Kanji, title, ingredient line and render each cross-dissolve on a spring, every layer lagging the one before it, with the giant watermark kanji moving **last and slowest** — depth without 3D. What is *not* settled is how much: stagger offset, spring stiffness and damping, opacity floor, and whether any layer moves in space at all or only in opacity.

Consult the `motion` skill before writing anything. Import from `motion/react`. The standing bias is less — if two candidates are close, take the quieter one.

Also settle here: whether the transition differs when moving one step along the rail versus jumping several, and what `prefers-reduced-motion` collapses it to.

Link the prototype from this ticket and record the chosen numbers in the answer.
