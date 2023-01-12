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
    debug(`starting poller for ${this.event}`)

    if (!this.#timeout) {
      this.#poll()
    }

    return this.ctx.emitter.subscribeTo(this.event, {
      sendInitial: false,
      initialValue,
      onUnsubscribe: () => {
        debug(`in unsubscribe for ${this.event}`)
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

    this.#timeout = setTimeout(() => {
      this.#timeout = undefined
      this.#poll()
    }, this.pollingInterval * 1000)
  }

  #stop () {
    debug(`stopping poller for ${this.event}`)
    if (this.#timeout) {
      clearInterval(this.#timeout)
      this.#timeout = undefined
    }
  }
}
