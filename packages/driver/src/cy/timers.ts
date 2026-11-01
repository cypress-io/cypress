import type { ICypress } from '../cypress'
import type { RemoteAutCall } from '@packages/types'
import { isRemoteDriverEnabled } from './remote'

// the remote driver's script in the AUT wraps its timers, as the legacy bootstrap does
const callRemoteAutTimers = (Cypress: ICypress, args: Extract<RemoteAutCall, { method: 'timers' }>['args']) => {
  return Promise.resolve(Cypress.automation('remote:aut:call', { method: 'timers', args })).catch(() => {})
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress: ICypress) => ({
  reset () {
    return isRemoteDriverEnabled(Cypress) ? callRemoteAutTimers(Cypress, ['reset']) : Cypress.action('app:timers:reset')
  },

  pauseTimers (shouldPause) {
    return isRemoteDriverEnabled(Cypress) ? callRemoteAutTimers(Cypress, ['pause', Boolean(shouldPause)]) : Cypress.action('app:timers:pause', shouldPause)
  },
})

export interface ITimer {
  pauseTimers: ReturnType<typeof create>['pauseTimers']
}
