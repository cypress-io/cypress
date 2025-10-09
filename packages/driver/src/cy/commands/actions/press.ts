import type { $Cy } from '../../../cypress/cy'
import type { StateFunc } from '../../../cypress/state'
import { isSupportedKey, SupportedKey, AutomationCommands } from '@packages/types'
import { defaults } from 'lodash'
import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'

export interface PressCommand {
  (key: SupportedKey | string, userOptions?: Partial<Cypress.Loggable> & Partial<Cypress.Timeoutable>): void
}

export default function (Commands: Cypress.Commands, Cypress: Cypress.Cypress, cy: $Cy, state: StateFunc, config: any) {
  async function pressCommand (key: SupportedKey | string | number, userOptions?: Partial<Cypress.Loggable> & Partial<Cypress.Timeoutable>) {
    const options: Cypress.Loggable & Partial<Cypress.Timeoutable> = defaults({}, userOptions, {
      log: true,
    })
    const deltaOptions = $utils.filterOutOptions(options)

    const log = Cypress.log({
      timeout: options.timeout,
      hidden: options.log === false,
      message: [key, deltaOptions],
      consoleProps () {
        return {
          'Key': key,
        }
      },
    })

    if (!isSupportedKey(key)) {
      $errUtils.throwErrByPath('press.invalid_key', {
        onFail: log,
        args: { key },
      })

      // throwErrByPath always throws, but there's no way to indicate that
      // code beyond this point is unreachable to typescript / linters
      return null
    }

    if (Cypress.browser.family === 'webkit') {
      $errUtils.throwErrByPath('press.unsupported_browser', {
        onFail: log,
        args: {
          family: Cypress.browser.family,
        },
      })

      return null
    }

    try {
      const command: 'key:press' = 'key:press'
      const args: AutomationCommands[typeof command]['dataType'] = {
        key,
      }

      await Cypress.automation('key:press', args)
    } catch (err) {
      $errUtils.throwErr(err, { onFail: log })
    }

    return null
  }

  return Commands.addAll({
    press: pressCommand,
  })
}
