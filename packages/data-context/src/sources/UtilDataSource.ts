import DataLoader from 'dataloader'
import crypto from 'crypto'
import fetch from 'cross-fetch'
import type { DataContext } from '../DataContext'

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
    return fetch
  }
}
