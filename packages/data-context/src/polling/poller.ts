import type { EventType } from '../actions'
import type { DataContext } from '../DataContext'
import debugLib from 'debug'

const debug = debugLib('cypress:data-context:polling:Poller')

export class Poller<E extends EventType> {
  constructor (private ctx: DataContext,
    private event: E,
    private pollingInterval: number,
    private callback: () => Promise<any>) {}

  #timeout?: NodeJS.Timeout

  set interval (interval: number) {
    debug(`interval for ${this.event} set to ${interval}`)
    this.pollingInterval = interval
  }

  start (initialValue?: any) {
    if (!this.#timeout) {
      debug(`starting poller for ${this.event}`)
      this.#poll().catch((e) => {
        debug('error executing poller %o', e)
      })
    }

    debug(`subscribing to ${this.event}`)

    return this.ctx.emitter.subscribeTo(this.event, {
      sendInitial: false,
      initialValue,
      onUnsubscribe: () => {
        debug(`stopping poller for ${this.event}`)
        this.#stop()
      },
    })
  }

  async #poll () {
    if (this.#timeout) {
      return
    }

    debug(`polling for ${this.event} with interval of ${this.pollingInterval} seconds`)

    await this.callback()

    this.#timeout = setTimeout(async () => {
      this.#timeout = undefined
      await this.#poll()
    }, this.pollingInterval * 1000)
  }

  #stop () {
    debug(`stopping poller for ${this.event}`)
    if (this.#timeout) {
      clearTimeout(this.#timeout)
      this.#timeout = undefined
    }
  }
}
