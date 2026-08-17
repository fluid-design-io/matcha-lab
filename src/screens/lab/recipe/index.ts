/**
 * The recipe overlay.
 *
 * One public entry point. The panel reads the selected drink and the open flag straight off
 * `lab.context`, so the screen mounts it and nothing else — there are no props to thread and no
 * leaf inside this folder that anything outside it should reach for.
 */
export { RecipeOverlay } from './recipe.overlay'
