import _ from 'lodash'
import type { PrimaryDomainCommunicator } from '../../multi-domain/communicator'
import { createDeferred, Deferred } from '../../util/deferred'

export class LogsManager {
  logs: { [key: string]: {
    deferred: Deferred
    log: Cypress.Log
  }} = {}

  communicator: PrimaryDomainCommunicator

  constructor ({ communicator }) {
    this.communicator = communicator
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

    await Promise.all(pendingLogs)
    this.communicator.off('log:changed', this.onLogChanged)
  }
}
