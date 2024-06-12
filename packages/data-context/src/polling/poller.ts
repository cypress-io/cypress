import type { EventType } from '../actions'
import type { DataContext } from '../DataContext'
import debugLib from 'debug'

const debug = debugLib('cypress:data-context:polling:Poller')

export class Poller<E extends EventType, T = never, M = never> {
  constructor (private ctx: DataContext,
    private event: E,
    private pollingInterval: number,
    private callback: (subscriptions: { meta: M | undefined }[]) => Promise<any>) {}

  #timeout?: NodeJS.Timeout
  #isPolling: boolean = false

  #subscriptionId: number = 0
  #subscriptions: Record<string, { meta: M | undefined }> = {}

  get subscriptions () {
    return Object.values(this.#subscriptions)
  }

  set interval (interval: number) {
    debug(`interval for ${this.event} set to ${interval}`)
    this.pollingInterval = interval
  }

  start (config: {initialValue?: T, meta?: M, filter?: (val: any) => boolean} = {}) {
    const subscriptionId = ++this.#subscriptionId

    debug(`subscribing to ${this.event} with initial value %o and meta %o`, config?.initialValue, config?.meta)
    this.#subscriptions[subscriptionId] = { meta: config.meta }
    debug('subscriptions after subscribe', this.#subscriptions)

    if (!this.#isPolling) {
      this.#isPolling = true
      debug(`starting poller for ${this.event}`)
      this.#poll().catch((e) => {
        debug('error executing poller %o', e)
      })
    }

    return this.ctx.emitter.subscribeTo(this.event, {
      sendInitial: false,
      initialValue: config.initialValue,
      filter: config.filter,
      onUnsubscribe: (listenerCount) => {
        debug(`onUnsubscribe for ${this.event}`)
        delete this.#subscriptions[subscriptionId]

        if (listenerCount === 0) {
          debug(`listener count is 0 for ${this.event}`)
          this.#stop()
        }
      },
    })
  }

  async #poll () {
    debug(`polling for ${this.event}`)
    if (!this.#isPolling) {
      debug('terminating poll after being stopped')

      return
    }

    debug(`calling poll callback for ${this.event}`)

    await this.callback(this.subscriptions)

    if (!this.#isPolling) {
      debug('poller terminated during callback')

      return
    }

    debug(`setting timeout with interval of ${this.pollingInterval} second`)
    this.#timeout = setTimeout(async () => {
      this.#timeout = undefined
      await this.#poll()
    }, this.pollingInterval * 1000)
  }

  #stop () {
    debug(`stopping poller for ${this.event}`, !!this.#timeout)
    if (this.#timeout) {
      clearTimeout(this.#timeout)
      this.#timeout = undefined
    }

    this.#isPolling = false
  }
}
