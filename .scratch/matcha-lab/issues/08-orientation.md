# Orientation adaptation

Type: task
Status: open
Blocked by: 07

## Question

Make the layout adapt cleanly by aspect ratio so landscape and portrait are both first-class — not two layouts behind a width breakpoint.

- **Portrait (1024×1366)** follows reference 1: the rail becomes **horizontal along the bottom**, kanji in a row with romaji beneath each; the header spans the top; the title block and recipe affordance sit above the rail. The render frame stays a centred square, sized off the narrower axis.
- **Landscape (1366×1024)** stays as built in [Landscape master layout](./07-landscape-layout.md).
- The rail is **one component that reflows**, not two components swapped. Same nine children, same selection state, same accent underline — only flow direction and label placement change.
- Drive it from the aspect-ratio `--breakpoint-*` tokens defined in [App shell and SPA foundation](./02-app-shell.md), which combine `min-width` and `min-height`. A short-but-wide window must not get the tall treatment.
- Container queries belong *inside* components that render at very different sizes, not at the top level.

Verify 1366×1024, 1194×834, 1024×1366 and 1024×768. Rotating the iPad must not reload or lose selection. Mobile should not be broken, but polish there is explicitly a nice-to-have.
