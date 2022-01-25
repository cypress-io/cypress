import _ from 'lodash'
import type { PrimaryDomainCommunicator } from '../../multi-domain/communicator'
import { createDeferred, Deferred } from '../../util/deferred'
import { correctStackForCrossDomainError } from './util'

export class LogsManager {
  logs: { [key: string]: {
    deferred: Deferred
    log: Cypress.Log
  }} = {}

  communicator: PrimaryDomainCommunicator
  userInvocationStack: string

  constructor ({ communicator, userInvocationStack }) {
    this.communicator = communicator
    this.userInvocationStack = userInvocationStack
  }

  listen () {
    this.communicator.on('log:added', this.onLogAdded)
    this.communicator.on('log:changed', this.onLogChanged)
  }

  onLogAdded = (attrs) => {
    if (!attrs) return

    attrs.consoleProps = () => attrs.consoleProps
    attrs.renderProps = () => attrs.renderProps

    const log = Cypress.log(attrs)

    // if the log needs to stream updates, defer its result to make sure all streamed updates come in
    if (!attrs.ended) {
      this.logs[log.get('id')] = {
        log,
        deferred: createDeferred(),
      }
    }
  }

  onLogChanged = (attrs) => {
    const changedLog = this.logs[attrs?.id]

    // NOTE: sometimes debug logs that are created in the secondary are only emitted through 'log:changed' events
    // and no initial log is created in 'log:added
    // These logs are not important to the primary domain, so we can ignore them
    if (!changedLog) return

    const { deferred, log } = changedLog
    const logAttrs = log.get()

    _.forEach(attrs, (value: any, key: string) => {
      if (
        value != null
        && !(_.isObject(value) && _.isEmpty(value))
        && !_.isEqual(value, logAttrs[key])
      ) {
        log.set(key as keyof Cypress.LogConfig, value)
      }
    })

    const isEnded = log.get('ended')

    if (isEnded) {
      if (log.get('state') === 'failed') {
        const err = log.get('err')
        let parsedError = correctStackForCrossDomainError(err, this.userInvocationStack)

        // The toJSON method on the Cypress.Log converts the 'error' property to 'err', so when the log gets
        // serialized from the SD to the PD, we need to do the opposite
        log.set('error', parsedError)
        if ((logAttrs.consoleProps as any)?.Error) {
          // Update consoleProps for when users pin failed commands in the reporter so correct error messages are displayed in the console
          (logAttrs.consoleProps as any).Error = parsedError.stack
        }
      }

      delete this.logs[attrs.id]
      deferred.resolve()
    }
  }

  async cleanup () {
    this.communicator.off('log:added', this.onLogAdded)

    // don't allow for new logs to be added, but wait for logs
    // to update changes in the secondary domain
    const pendingLogs = Object.values(this.logs).map((log) => {
      return log.deferred.promise
    })

    try {
      await Promise.all(pendingLogs)
    } finally {
      this.communicator.off('log:changed', this.onLogChanged)
    }
  }
}
