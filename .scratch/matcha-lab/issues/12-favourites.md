# Favourites

Type: task
Status: resolved
Blocked by: 04, 07

## Answer

The store from [Data layer](./04-data-layer.md) needed nothing changed — it already hydrated in an
effect, already wrote through on every toggle, and already read before it subscribed. What was
missing was a control, and proof.

### The control was unreachable, and the tests could not have caught it

The first pass built the toggle and proved the *store*, and both were correct. The **control** was
not: the recipe overlay had no `z-index`, `LabShell` is `relative z-10`, and a positive z beats tree
order, so the app shell hit-tested above the whole dialog. `document.elementFromPoint` at the centre
of this button returned the rail's `<nav>`. This app's only favourite control could not be pressed
by a finger at any viewport, and nothing in the ticket's evidence said so, because unit tests
against a store cannot see a stacking context and the toggle was never driven through a real
pointer.

Fixed in [Recipe overlay](./11-recipe-overlay.md) — the popup and the backdrop are `z-20` above the
shell's `z-10`. Re-verified here as an interaction rather than as a store call: a real pointer click
on the button at its measured centre flips `aria-pressed` from `true` to `false`, swaps the label
from `SAVED` to `SAVE`, rewrites `matcha-lab:favourites` in `localStorage`, and leaves the panel
open. **Drive the control, not the hook** — that is the gap this ticket had.

### The toggle

`src/screens/lab/recipe/recipe.favourite.tsx`, bottom right of the recipe panel's footer. It reads
`useIsFavourite` and calls `useToggleFavourite`; it never sees the store, the storage key or the
shape of what is written.

This is the one thing in the app allowed to be louder than the ambient motion, and the shape of
"louder" is **two beats and one overshoot**:

1. an accent outline heart fades up over the resting one — *this one is on*
2. one `--motion-stagger` (40ms) later, the fill lands
3. the whole 12px box springs through `[1, 1.125, 1]`

Three `Heart`/`HeartFill` glyphs stacked in one 12px box, deep-imported. **Nothing animates
`color`** — that is the entire reason for the stack. Two opacity fades and one scale keyframe are
all `opacity` and `transform`, which is what the design contract allows; a `color` transition
between `--color-on-paper-faint` and `--color-accent` would have been one line and one rule broken.

**The overshoot is derived from the tokens, not switched on them.** `1 + tokens.drift / 32` is
1.125× at full motion — comfortably under the 1.15 ceiling — and exactly 1 under reduced motion,
because reduced motion zeroes `drift`. The same setting that takes 4px of rise out of the drink
change takes the bounce out of the heart, with no second branch to forget about. Duration is
`layer.visualDuration × 0.9` = 342ms, and 108ms reduced. Both under 400ms.

Two details that are not decoration:

- **`initial={false}` on all three motion elements.** Opening the panel on an already-saved drink
  must *show* a filled heart, not perform one. Nothing in this app animates on mount.
- **The label sits in a fixed 48px right-aligned box.** `SAVE` is one character narrower than
  `SAVED` (43px versus 47px at the roomy scale, measured off the real subset font), and without the
  fixed box the heart would step sideways every time the state changed — in a right-aligned group,
  a narrower word moves everything to its left.

The masthead counter was already correct and already fading in after hydration; it was not touched.

### Persistence, proved

`src/domain/favourites/__test__/favourites.store.test.ts` gains a `describe('a cold launch')`. The
seven tests that were already there could not make the claim the ticket actually cares about: they
all share one module instance, so `favouritesStore` already holds the answer before hydration is
asked for. A relaunch is a **fresh module against a surviving storage**.

Bun resolves a cache-busted dynamic import (`import('../favourites.store?cold=2')`) to a genuinely
new module instance, so the second launch starts at `EMPTY, hydrated: false` exactly as a cold iPad
does. The test favourites three drinks, tears the first session down, asserts the module identity
actually differs, and then asserts the second launch reads all three back — plus that the relaunch
*did not write*, because hydration reading before it subscribes is the thing that keeps a cold
launch a pure read. A second test seeds two favourites, clears storage between launches, and
asserts a clean first run.

`bun test src/domain/favourites` → 14 pass, and the seven original tests are untouched.

### One thing deliberately not wired

**The main view has no favourite toggle.** Ticket 12 leaves it to judgement ("if it can be made to
feel right"), and on the evidence it cannot — not without a fifth icon or a second accent, both of
which `DESIGN-TASTE.md` calls regressions. The footer's bottom-right group is already occupied by
the recipe affordance, which the layout ticket says may not move; a heart anywhere else in the
title block violates "the title block may not gain a CTA button". Recommendation: leave it. Opening
the recipe is one tap, the panel is where the drink is actually being considered, and the masthead
count already reflects the change the moment it happens.

`lab.masthead.tsx` and `lab.footer.tsx` belong to another stream, so this is a recommendation rather
than a change either way. It still stands after the overlay fix: the panel toggle now works, which
is the argument's premise, not a reason to add a second one.

### One thing that moved

At compact viewports the recipe panel drops the render and fills the screen, but the footer and its
toggle are unchanged — the favourite is reachable at every size, including 852×393 and 393×852,
confirmed by the same hit-test grid. The `SAVE`/`SAVED` label keeps its fixed 48px right-aligned box
there too, so the heart does not step sideways on a phone either.

## Question

Make favouriting real and persistent, backed by the favourites store from [Data layer on TanStack Store](./04-data-layer.md).

- Toggle from the recipe overlay (`♥ SAVED` / unsaved) and, if it can be made to feel right, from the main view.
- The **header counter** (`♡ 02` in the references) reflects the live favourite count.
- **Survives a cold launch.** A home-screen app that forgets favourites on relaunch is broken — this is the one piece of state that must outlive the session.
- The toggle is the most tactile moment in the app and the best home for the *slightly playful* note in the brief. Give it a little more life than the ambient motion elsewhere, but keep it restrained.

Use `Heart` and `HeartFill` from `@gravity-ui/icons`, deep-imported. The references show an outline heart for the counter and a filled one for `♥ SAVED`, which maps exactly onto that pair.

The store hydrates in an effect, so first paint shows zero favourites and corrects on mount. At this scale that is imperceptible — but make sure it reads as *settling* rather than *flickering*, and if the counter visibly pops, fade it in rather than special-casing hydration.

Verify: favourite three drinks, hard-reload, confirm all three persist and the counter is right. Then clear storage and confirm a clean first run.
