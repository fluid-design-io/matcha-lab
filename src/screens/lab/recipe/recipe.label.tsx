/**
 * The `材料 / BUILD` group label — kanji, slash, letterspaced Latin.
 *
 * Two of the three groups use it. The third, `味 TASTING NOTE`, deliberately does not: it has no
 * slash and its kanji sits at full ink because it is the first row of the axis stack rather than a
 * heading floating above one. Measured off `ref-3-recipe.png`, where 味 is visibly darker than
 * 材料 and 手順 and shares their column with 椰 乳 力 涼 濃.
 */
export function RecipeLabel({ kanji, latin }: { kanji: string; latin: string }) {
  return (
    <p className="flex items-baseline gap-2 text-on-paper-muted">
      <span className="font-jp text-kanji-sm untrack">{kanji}</span>
      <span className="text-label untrack uppercase">/ {latin}</span>
    </p>
  )
}
