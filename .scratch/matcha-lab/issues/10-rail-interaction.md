# Rail interaction

Type: task
Status: open
Blocked by: 07, 09

## Question

Make the rail live, using the motion values settled in [Motion calibration](./09-motion-calibration.md).

- **Tap** a kanji to select its drink. Generous hit targets — the visible kanji is small, the touch target must not be.
- **Horizontal swipe** on the render area moves between drinks. This is the gesture that makes it feel iPad-native rather than a website on a tablet; it is worth doing properly, including at the ends of the collection.
- **Arrow keys** move selection, so it is demoable on a laptop.
- The **accent underline** slides between positions as a single shared layout element rather than nine independently animated ones. Motion's layout animation is the tool.
- Selected kanji scales up and darkens to ink; unselected stay pale. Romaji appears for the selected one.

Explicitly **not** in scope: pinch, long-press, drag-to-reorder. That is density creeping back in.

Interaction must work identically in both rail orientations from [Orientation adaptation](./08-orientation.md) — swipe direction stays horizontal-on-the-render in both. Keyboard focus order and visible focus states must be sane; this is a real UI, not a demo.
