import type { $Cy } from '../../../cypress/cy'
import type { StateFunc } from '../../../cypress/state'
import type { KeyPressSupportedKeys, AutomationCommands } from '@packages/types'
import $errUtils from '../../../cypress/error_utils'

export default function (Commands: Cypress.Commands, Cypress: Cypress.Cypress, cy: $Cy, state: StateFunc, config: any) {
  // @ts-expect-error - typescript isn't referencing cli/types/cypress.d.ts' Chainable interface, here
  return Commands.add('press', async (key: KeyPressSupportedKeys, userOptions?: Partial<Loggable> & Partial<Timeoutable>) => {
    const options: Cypress.Loggable & Cypress.Timeoutable = _.defaults({}, userOptions, {
      log: true,
    })

    const log = Cypress.log({
      timeout: options.timeout,
      hidden: options.log === false,
      consoleProps () {
        return {
          'Key': key,
        }
      },
    })

    try {
      const command: 'key:press' = 'key:press'
      const args: AutomationCommands[typeof command]['dataType'] = {
        key,
      }

      await Cypress.automation('key:press', args)
    } catch (err) {
      $errUtils.throwErr(err, { onFail: log })
    }
  })
}
