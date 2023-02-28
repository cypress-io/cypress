import type { EventType } from '../actions'
import type { DataContext } from '../DataContext'
import debugLib from 'debug'

const debug = debugLib('cypress:data-context:polling:Poller')

export class Poller<E extends EventType, M> {
  constructor (private ctx: DataContext,
    private event: E,
    private pollingInterval: number,
    private callback: () => Promise<any>) {}

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

  start (config?: {initialValue?: any, meta?: M}) {
    if (!this.#isPolling) {
      this.#isPolling = true
      debug(`starting poller for ${this.event}`)
      this.#poll().catch((e) => {
        debug('error executing poller %o', e)
      })
    }

    const subscriptionId = ++this.#subscriptionId

    debug(`subscribing to ${this.event} with initial value %o`, config?.initialValue)
    this.#subscriptions[subscriptionId] = { meta: config?.meta }

    return this.ctx.emitter.subscribeTo(this.event, {
      sendInitial: false,
      initialValue: config?.initialValue,
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
    debug(`polling for ${this.event} with interval of ${this.pollingInterval} seconds`)

    await this.callback()

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
