import { MatchaField } from '#/components/matcha-field'
import { useFavouritesPersistence } from '#/domain/favourites'

import { LabProvider } from './lab.context'
import { LabFooter } from './lab.footer'
import { LabMasthead } from './lab.masthead'
import { LabShell } from './lab.shell'
import { LabStage } from './lab.stage'
import { Rail } from './rail'

/** The one route surface. NAGI opens. */
export function LabScreen() {
  useFavouritesPersistence()

  return (
    <LabProvider>
      <MatchaField />
      <LabShell
        masthead={<LabMasthead />}
        stage={<LabStage />}
        footer={<LabFooter />}
        rail={<Rail />}
      />
    </LabProvider>
  )
}
