import DataLoader from 'dataloader'
import crypto from 'crypto'
import fetch from 'cross-fetch'
import type { DataContext } from '../DataContext'

// Require rather than import since data-context is stricter than network and there are a fair amount of errors in agent.
const { agent } = require('@packages/network')

// @ts-ignore agent isn't a part of cross-fetch's API since it's not a part of the browser's fetch but it is a part of node-fetch
// which is what will be used here
const proxiedFetch = (input: RequestInfo, init?: RequestInit) => fetch(input, { agent, ...init })

/**
 * this.ctx.util....
 *
 * Used as a central location for grab-bag utilities used
 * within the DataContext layer
 */
export class UtilDataSource {
  constructor (private ctx: DataContext) {}

  private _allLoaders: DataLoader<any, any>[] = []

  async settleAll<T> (promises: Promise<T>[]) {
    const vals = await Promise.allSettled(promises)

    return vals.map((v) => v.status === 'fulfilled' ? v.value : this.ensureError(v.reason))
  }

  /**
   * Utility for a promise delay, in milliseconds
   */
  async delayMs (ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  assertAbsolute (val: string) {
    if (!this.ctx.path.isAbsolute(val)) {
      throw new Error(`Expected ${val} to be an absolute path`)
    }
  }

  ensureError (val: any): Error {
    return val instanceof Error ? val : new Error(val)
  }

  loader = <K, V, C = K>(batchLoadFn: DataLoader.BatchLoadFn<K, V>) => {
    const loader = new DataLoader<K, V, C>(batchLoadFn, { cache: false })

    this._allLoaders.push(loader)

    return loader
  }

  disposeLoaders () {
    for (const loader of this._allLoaders) {
      loader.clearAll()
    }
  }

  sha1 (value: string) {
    return crypto.createHash('sha1').update(value).digest('hex')
  }

  get fetch () {
    return proxiedFetch
  }
}
