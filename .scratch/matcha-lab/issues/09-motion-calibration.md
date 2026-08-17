# Motion calibration

Type: prototype
Status: open
Blocked by: 07

## Question

Find the right intensity for the drink-change transition, then write the winning values into `DESIGN-TASTE.md` as motion tokens.

This is a **prototype ticket, human in the loop** — "so subtle that only someone paying close attention notices it" is a taste judgement that cannot be settled by reasoning about numbers. Build the transition at three or four intensities, put them side by side at 1366×1024, and have the human pick. Do not answer this one alone.

The shape is settled: a **staggered dissolve**. Kanji, title, ingredient line and render each cross-dissolve on a spring, every layer lagging the one before it, with the giant watermark kanji moving **last and slowest** — depth without 3D. What is *not* settled is how much: stagger offset, spring stiffness and damping, opacity floor, and whether any layer moves in space at all or only in opacity.

Consult the `motion` skill before writing anything. Import from `motion/react`. The standing bias is less — if two candidates are close, take the quieter one.

Also settle here: whether the transition differs when moving one step along the rail versus jumping several, and what `prefers-reduced-motion` collapses it to.

Link the prototype from this ticket and record the chosen numbers in the answer.
