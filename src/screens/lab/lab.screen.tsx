import { MatchaField } from '#/components/matcha-field'
import { useFavouritesPersistence } from '#/domain/favourites'

import { LabShell } from './lab.shell'

/**
 * The one route surface.
 *
 * Currently the empty shell — ticket 02 laid the ground and ticket 04 the data layer; the
 * masthead, watermark, render frame, title block, recipe affordance and rail land in ticket 07.
 */
export function LabScreen() {
  useFavouritesPersistence()

  return (
    <>
      <MatchaField />
      <LabShell masthead={null} stage={null} footer={null} rail={null} />
    </>
  )
}
