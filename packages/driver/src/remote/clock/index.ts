// Runs in the AUT's main world under the remote driver, injected by the server, so cy.clock
// can replace the AUT's own timers. The server drives it through REMOTE_CLOCK_GLOBAL.
import { create } from '../../cypress/clock'
import type { Clock } from '../../cypress/clock'
import { REMOTE_CLOCK_GLOBAL } from '../protocol'

const key = Symbol.for(REMOTE_CLOCK_GLOBAL)

if (!Reflect.has(window, key)) {
  let clock: Clock | undefined

  const details = () => clock?.details() ?? { now: 0, methods: [] }

  Object.defineProperty(window, key, {
    configurable: true,
    value: {
      install (now: number | undefined, methods: string[] | undefined) {
        clock?.restore()
        clock = create(window, now, methods)

        return details()
      },
      tick (ms: number) {
        clock?.tick(ms)

        return details()
      },
      setSystemTime (now: number) {
        clock?.setSystemTime(now)

        return details()
      },
      restore () {
        clock?.restore()
        clock = undefined

        return details()
      },
    },
  })
}
