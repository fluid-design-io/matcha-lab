import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The app's own font-size utilities, one per `--text-*` in `styles.css`. tailwind-merge only knows
 * the stock `text-xs…text-9xl` scale, so without this it reads `text-kanji-lg` as a colour and drops
 * it whenever a `text-<role>` colour follows in the same class list. Add a `--text-*` token, add it
 * here.
 */
const TEXT_SIZES = [
  'title',
  'quantity',
  'kanji-xl',
  'kanji-lg',
  'kanji-md',
  'kanji-sm',
  'kanji-xs',
  'body',
  'name',
  'detail',
  'romaji',
  'label',
  'numeral',
  'micro',
]

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TEXT_SIZES }] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
