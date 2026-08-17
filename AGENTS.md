<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Where things go

Per the `react-composition-structure` skill. Establish nothing new without a reason.

```
src/
  assets/           fonts/ and renders/ — imported, so Vite fingerprints them
  components/       shared, multi-part UI. Compound folders with one public namespace
  domain/           content and state, no React components
    drinks/         the nine records + derivations over the collection
    favourites/     the one thing that persists
  screens/          route-bound modules; `lab/` is the only route surface
  routes/           thin TanStack Router wrappers — no orchestration
  lib/              helpers with a proven second consumer
  styles.css        the token system. Colours, type, spacing, motion
```

One stem per folder, one responsibility per suffix (`.screen.tsx`, `.data.ts`, `.types.ts`,
`.context.tsx`, `.utils.ts`, `.content.ts`). `index.ts` is the only public boundary; leaves stay
internal unless they are intentionally public.

## Commits and pull requests

These rules apply to commit subjects and PR titles alike. A commit subject is held to exactly the same standard as the title of the PR that carries it.

- Make sure the subject follows conventions from the repo. They should be simple and easy to understand conventional commit styles in projects that use them, i.e., "fix(api): no longer spike CPU".
- Name the code that actually changed. No metaphors, no invented nicknames for a component, no cute phrasing. "fix(api): stack the hotel plaque's actions instead of rowing them" should have been "fix(api): align hotel actions vertically". If a reader can't map the subject back to a file or symbol, rewrite it.
- Commit and PR bodies should aim for simplicity. Open with a minimum clear description of the problem. Follow up with how you solved it. Skip the body when the subject already says everything.



## Before touching UI

Read `DESIGN-TASTE.md`. Every colour, type size, motion timing and layout number is a token
there — if you are about to hard-code one, it already exists.

- `docs/design/layout-geometry.md` — measurements, viewport by viewport
- `docs/design/image-generation.md` — the contract the nine drink renders were made under

Consult the `motion` skill before writing any animation (import from `motion/react`, never
`framer-motion`), and the `typegpu` skill before touching the field shader.
