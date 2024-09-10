import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
import { runPrivilegedCommand } from '../../util/privileged_channel'

interface InternalChooseCertOptions extends Partial<Cypress.Loggable> {
  _log?: Log
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    chooseCert (group: string | null, userOptions: Partial<Cypress.Loggable>) {
      const options: InternalChooseCertOptions = _.defaults({}, userOptions, {
        log: true,
      })

      let consoleOutput = {}

      let message = `choosing cert group: ${group}`

      options._log = Cypress.log({
        hidden: !options.log,
        message,
        consoleProps () {
          return consoleOutput
        },
      })

      if (group !== null && !_.isString(group)) {
        $errUtils.throwErrByPath('chooseCert.invalid_argument', {
          onFail: options._log,
          args: { group: group || 'null' },
        })
      }

      return runPrivilegedCommand({
        commandName: 'chooseCert',
        cy,
        Cypress: (Cypress as unknown) as InternalCypress.Cypress,
        options: {
          group,
        },
      })
    },
  })
}
