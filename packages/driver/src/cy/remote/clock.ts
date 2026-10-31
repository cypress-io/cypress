import Promise from 'bluebird'
import type { RemoteClockDetails } from '@packages/types'
import type { ICypress } from '../../cypress'

const isClockDetails = (value: unknown): value is RemoteClockDetails => {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'now') === 'number' && Array.isArray(Reflect.get(value, 'methods'))
}

// cy.clock under the remote driver. The clock runs in the AUT (the server installs it there and in
// every page the AUT loads while it's on), so each call is a round trip and details() is the last known state.
export const createRemoteClock = (Cypress: Pick<ICypress, 'automation'>, now: number | undefined, methods: string[] | undefined) => {
  let details: RemoteClockDetails = { now: now ?? 0, methods: [] }

  const update = (request: PromiseLike<unknown>) => {
    return Promise.resolve(request).then((result) => {
      if (isClockDetails(result)) {
        details = result
      }

      return details.now
    })
  }

  const installed = update(Cypress.automation('remote:clock:install', { now, methods }))

  return {
    installed,
    tick: (ms: number) => update(Cypress.automation('remote:clock:tick', { ms })),
    setSystemTime: (now: number) => {
      update(Cypress.automation('remote:clock:set:system:time', { now })).catch(() => {})
    },
    restore: () => {
      Cypress.automation('remote:clock:restore', {}).catch(() => {})
    },
    // a preload script installs the clock in each new page, so there's no window to bind it to
    bind: () => {},
    details: () => details,
  }
}

export type RemoteClock = ReturnType<typeof createRemoteClock>
