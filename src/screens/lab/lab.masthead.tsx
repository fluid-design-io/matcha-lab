import LogoGithub from '@gravity-ui/icons/LogoGithub'

/**
 * 抹茶 · MATCHA LAB, and the source link on the opposite margin. The accent hairline is a printer's
 * registration tick on the left content margin, and the negative offset is what lets it escape the
 * shell's top padding to reach the very edge of the viewport.
 */
export function LabMasthead() {
  return (
    <header className="relative flex items-start justify-between">
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

      <LabSource />
    </header>
  )
}

/** The repository, on the right content margin opposite 抹茶. */
function LabSource() {
  return (
    <a
      href="https://github.com/fluid-design-io/matcha-lab"
      target="_blank"
      rel="noreferrer"
      aria-label="Matcha Lab on GitHub"
      // The 44px target bleeds 14px past the glyph on three sides — so the box clears a finger
      // while the ink still lands on the content margin and on the 抹茶 line, not below it.
      className="-my-3.5 -mr-3.5 land:-mr-6 flex size-(--tap) shrink-0 items-center justify-center text-on-field-muted transition-colors hover:text-on-field-strong"
    >
      <LogoGithub width={16} height={16} aria-hidden />
    </a>
  )
}
