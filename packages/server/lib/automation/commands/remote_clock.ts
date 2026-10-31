import Debug from 'debug'
import { getRunnerRemoteClockContents } from '@packages/resolve-dist'
import type { RemoteClockDetails } from '@packages/types'
import { IS_AUT_DOCUMENT } from './remote_visit'
import type { AutScripts } from './remote_visit'

const debug = Debug('cypress:server:automation:remote_clock')

const CLOCK = 'window[Symbol.for(\'cypress:remote:clock\')]'
const CLOCK_MISSING = '__cypress_remote_clock_missing__'

// cy.clock under the remote driver: Cypress's clock runs in the AUT's main world, where it can replace
// the AUT's own timers. A preload script installs it in every document the AUT loads while it's on,
// starting from the same time, as the legacy driver rebinds its clock to each new window.
export class RemoteClock {
  private source: Promise<string> | undefined
  private removePreloadScript: (() => Promise<unknown>) | undefined
  // the driver sends ticks without waiting on each other, so they're applied in the order they arrive
  private queue: Promise<unknown> = Promise.resolve()

  constructor (private scripts: AutScripts, private getSource: () => Promise<Buffer | string> = getRunnerRemoteClockContents) {}

  install ({ now, methods }: { now?: number, methods?: string[] }) {
    const call = `install(${JSON.stringify(now)}, ${JSON.stringify(methods)})`

    return this.enqueue(async () => {
      await this.clearPreloadScript()
      this.removePreloadScript = await this.scripts.addPreloadScript(`(() => {\nif (!${IS_AUT_DOCUMENT}) return\n${await this.getClockSource()}\n${CLOCK}.${call}\n})()`)

      return this.run(call)
    })
  }

  tick ({ ms }: { ms: number }) {
    return this.enqueue(() => this.run(`tick(${JSON.stringify(ms)})`))
  }

  setSystemTime ({ now }: { now: number }) {
    return this.enqueue(() => this.run(`setSystemTime(${JSON.stringify(now)})`))
  }

  restore () {
    return this.enqueue(async () => {
      await this.clearPreloadScript()
      await this.scripts.evaluateInAut(`(() => { const clock = ${CLOCK}; clock && clock.restore(); return 'restored' })()`)
      .catch((err) => debug('could not restore the clock: %s', err?.message))
    })
  }

  private enqueue<T> (fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn)

    this.queue = next.catch(() => {})

    return next
  }

  private getClockSource () {
    this.source ??= Promise.resolve(this.getSource()).then(String)

    return this.source
  }

  // sends the clock's source only when the document doesn't have it yet, since it's large
  private async run (call: string): Promise<RemoteClockDetails> {
    let result = await this.scripts.evaluateInAut(`(() => { const clock = ${CLOCK}; return clock ? JSON.stringify(clock.${call}) : '${CLOCK_MISSING}' })()`)

    if (result === CLOCK_MISSING) {
      result = await this.scripts.evaluateInAut(`(() => {\n${await this.getClockSource()}\nreturn JSON.stringify(${CLOCK}.${call})\n})()`)
    }

    return JSON.parse(result)
  }

  private async clearPreloadScript () {
    const remove = this.removePreloadScript

    this.removePreloadScript = undefined
    await remove?.().catch(() => {})
  }
}
