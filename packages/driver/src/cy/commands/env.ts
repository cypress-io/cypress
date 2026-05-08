import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import $stackUtils from '../../cypress/stack_utils'
import { runPrivilegedCommand } from '../../util/privileged_channel'

interface EnvOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  log?: boolean
  timeout?: number
}

export default (Commands: Cypress.Cypress['Commands'], Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']) => {
  Commands.addAll({
    env (envVars: string[], userOptions: EnvOptions = {}) {
      const options: { timeout: number, log: boolean, _log?: Cypress.Log } = _.defaults({}, userOptions, {
        timeout: 4000,
        log: true,
      })

      // argument must be an array
      if (!Array.isArray(envVars)) {
        $errUtils.throwErrByPath('env.invalid_argument', {
          args: { envVar: envVars },
        })
      }

      // if nothing is passed in, throw an error
      if (envVars.length === 0) {
        $errUtils.throwErrByPath('env.invalid_argument', {
          args: { envVar: undefined },
        })
      }

      // if any of the envVars are empty strings or NOT a string, throw an error
      for (const envVar of envVars) {
        if (typeof envVar !== 'string' || envVar === '') {
          $errUtils.throwErrByPath('env.invalid_argument', {
            args: { envVar },
          })
        }
      }

      let message = envVars.join(', ')

      options._log = Cypress.log({
        hidden: !options.log,
        message,
        timeout: options.timeout,
        consoleProps () {
          return envVars
        },
      })

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout()

      return runPrivilegedCommand({
        commandName: 'env',
        cy,
        Cypress: (Cypress as unknown) as InternalCypress.Cypress,
        options: {
          envVars,
          timeout: options.timeout,
        },
      })
      .timeout(options.timeout)
      .then((result) => {
        return result
      })
      .catch(Promise.TimeoutError, () => {
        $errUtils.throwErrByPath('env.timed_out', {
          args: { envVars, timeout: options.timeout },
        })
      })
      .catch({ timedOut: true }, (error: any) => {
        $errUtils.throwErrByPath('env.server_timed_out', {
          args: { envVars, timeout: options.timeout, error: error.message },
        })
      })
      .catch((err) => {
        // re-throw if timedOut error from above
        if ($errUtils.isCypressErr(err)) {
          throw err
        }

        if (err.isNonSpec) {
          $errUtils.throwErrByPath('miscellaneous.non_spec_invocation', {
            args: { cmd: 'env' },
          })
        }

        err.stack = $stackUtils.normalizedStack(err)

        $errUtils.throwErrByPath('env.failed', {
          args: { envVars, error: err?.message || err },
          errProps: {
            appendToStack: {
              title: 'From Node.js Internals',
              content: err?.stack || err,
            },
          },
        })
      })
    },
  })
}
