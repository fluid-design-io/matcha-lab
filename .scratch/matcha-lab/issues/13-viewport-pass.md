# Viewport verification pass

Type: task
Status: open
Blocked by: 05, 06, 08, 10, 11, 12

## Question

The polish pass. Everything is built; this is where it becomes *finished*.

Drive the app in the browser at all four target viewports — 1366×1024, 1194×834, 1024×1366, 1024×768 — and at each one verify, with screenshots rather than assumption:

- No vertical scroll anywhere in the main experience. No nested scroll containers.
- The recipe overlay fits without scrolling at every size.
- Safe-area insets are respected; nothing collides with a home indicator or camera housing.
- Type hierarchy holds — micro-labels stay legible, the watermark kanji stays atmospheric rather than dominant, the render frame stays square.
- Rotation preserves selection and does not reload.
- The full loop works end to end at every size: select → view → open recipe → close → select another.

Then the qualitative pass, which is the actual point: does it feel **calm, spacious, minimal, elegant, tactile, slightly playful, visually distinctive**? Does it read as a digital café menu and a small exhibition rather than a dashboard? Where it does not, fix it — this ticket has licence to adjust spacing, scale and timing across the app.

Also here: a performance sanity check with the field shader running — frame rate, battery behaviour, and time to first meaningful paint on a cold load.

Anything found that is too large to fix in this pass becomes a new ticket rather than a compromise.
