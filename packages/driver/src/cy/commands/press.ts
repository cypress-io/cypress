import type { $Cy } from '../../cypress/cy'
import type { StateFunc } from '../../cypress/state'
import type { KeyPressSupportedKeys, AutomationCommands } from '@packages/types'

export default function (Commands: Cypress.Commands, Cypress: Cypress.Cypress, cy: $Cy, state: StateFunc, config: any) {
  // @ts-expect-error - typescript isn't referencing cli/types/cypress.d.ts' Chainable interface, here
  return Commands.add('press', async (key: KeyPressSupportedKeys, options: Partial<Loggable> & Partial<Timeoutable>) => {
    try {
      const command: 'key:press' = 'key:press'
      const args: AutomationCommands[typeof command]['dataType'] = {
        key,
      }

      await Cypress.automation('key:press', args)
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.log(err)
    }
  })
}
