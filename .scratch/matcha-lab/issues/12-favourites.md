# Favourites

Type: task
Status: open
Blocked by: 04, 07

## Question

Make favouriting real and persistent, backed by the favourites store from [Data layer on TanStack Store](./04-data-layer.md).

- Toggle from the recipe overlay (`♥ SAVED` / unsaved) and, if it can be made to feel right, from the main view.
- The **header counter** (`♡ 02` in the references) reflects the live favourite count.
- **Survives a cold launch.** A home-screen app that forgets favourites on relaunch is broken — this is the one piece of state that must outlive the session.
- The toggle is the most tactile moment in the app and the best home for the *slightly playful* note in the brief. Give it a little more life than the ambient motion elsewhere, but keep it restrained.

Use `Heart` and `HeartFill` from `@gravity-ui/icons`, deep-imported. The references show an outline heart for the counter and a filled one for `♥ SAVED`, which maps exactly onto that pair.

The store hydrates in an effect, so first paint shows zero favourites and corrects on mount. At this scale that is imperceptible — but make sure it reads as *settling* rather than *flickering*, and if the counter visibly pops, fade it in rather than special-casing hydration.

Verify: favourite three drinks, hard-reload, confirm all three persist and the counter is right. Then clear storage and confirm a clean first run.
