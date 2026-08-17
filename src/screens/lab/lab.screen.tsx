import { LabProvider } from './lab.context'
import { LabFooter } from './lab.footer'
import { LabMasthead } from './lab.masthead'
import { LabShell } from './lab.shell'
import { LabStage } from './lab.stage'
import { Rail } from './rail'
import { RecipeOverlay } from './recipe'

/** The one route surface. NAGI opens. */
export function LabScreen() {
  return (
    <LabProvider>
      <LabShell
        masthead={<LabMasthead />}
        stage={<LabStage />}
        footer={<LabFooter />}
        rail={<Rail />}
      />
      {/* Outside the shell, not inside it: the overlay portals to `<body>` and covers the whole
          viewport, so nesting it in the one-viewport grid would only give it a cell it ignores. */}
      <RecipeOverlay />
    </LabProvider>
  )
}
