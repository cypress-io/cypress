import type { TranspileCache } from './types'

/**
 * In memory transpile cache that is used if none was provided to `packherd:require`.
 */
export class DefaultTranspileCache implements TranspileCache {
  private readonly _cache: Map<string, string> = new Map()

  get (fullPath: string): string | undefined {
    // In memory cache only so we don't expect anything to be stale
    return this._cache.get(fullPath)
  }

  addAsync (origFullPath: string, convertedContent: string): Promise<void> {
    this.add(origFullPath, convertedContent)

    return Promise.resolve()
  }

  add (origFullPath: string, convertedContent: string): void {
    this._cache.set(origFullPath, convertedContent)
  }

  clearSync (): void {
    this._cache.clear()
  }
}
