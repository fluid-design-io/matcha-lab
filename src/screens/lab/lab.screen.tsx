import { LabShell } from './lab.shell'

/**
 * The one route surface.
 *
 * Currently the empty shell — ticket 02 establishes the ground, and the masthead, watermark,
 * render frame, title block, recipe affordance and rail land in ticket 07.
 */
export function LabScreen() {
  return <LabShell masthead={null} stage={null} footer={null} rail={null} />
}
