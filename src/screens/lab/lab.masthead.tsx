/**
 * 抹茶 · MATCHA LAB. The accent hairline is a printer's registration tick on the left content
 * margin, and the negative offset is what lets it escape the shell's top padding to reach the very
 * edge of the viewport.
 */
export function LabMasthead() {
  return (
    <header className="relative flex items-start">
      <span
        aria-hidden
        className="absolute left-0 hidden w-px bg-accent land:block"
        style={{
          top: 'calc(-1 * max(var(--edge), env(safe-area-inset-top)))',
          height: 'calc(max(var(--edge), env(safe-area-inset-top)) + 64px)',
        }}
      />

      {/* 12px stacked, measured off ref-1-portrait: 抹茶 ends at y=74, the label starts at y≈87. */}
      <div className="flex flex-col gap-3 land:flex-row land:items-baseline land:gap-[22px] land:pl-2.5">
        <span className="font-jp text-kanji-sm text-on-field-strong untrack">抹茶</span>
        <span className="text-label text-on-field-muted untrack uppercase">Matcha Lab</span>
      </div>
    </header>
  )
}
