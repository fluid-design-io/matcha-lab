/**
 * The `材料 / BUILD` group label — kanji, slash, letterspaced Latin.
 *
 * `味 TASTING NOTE` deliberately does not use it: no slash, full ink, because 味 is the first row
 * of the axis stack rather than a heading floating above one.
 */
export function RecipeLabel({ kanji, latin }: { kanji: string; latin: string }) {
  return (
    <p className="flex items-baseline gap-2 text-on-paper-muted">
      <span className="font-jp text-kanji-sm untrack">{kanji}</span>
      <span className="text-label untrack uppercase">/ {latin}</span>
    </p>
  )
}
