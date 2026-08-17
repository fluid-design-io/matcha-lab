/**
 * The drink collection — content, and the derivations over it.
 *
 * The whole point of this module is to be read, so the barrel is wide by design: every symbol
 * below is an intentional public entry point. Nothing here is state — see `#/domain/favourites`
 * for the one thing that persists.
 */
export { AXES, DRINKS, MATCHA_BASE, OPENING_DRINK_ID, SERVE_LABEL } from './drinks.content'
export { getDrinkRender, neighbourRenders } from './drinks.renders'
export {
  collectionExtremes,
  getAxis,
  getDrink,
  getDrinkIndex,
  leadsCollection,
} from './drinks.utils'
export type {
  Axis,
  AxisKey,
  AxisValue,
  BuildItem,
  Drink,
  DrinkId,
  FlavourAxes,
  MatchaBase,
  ServeTemperature,
} from './drinks.types'
