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
  setAsync (origFullPath: string, convertedContent: string): Promise<void> {
    this.set(origFullPath, convertedContent)

    return Promise.resolve()
  }
  set (origFullPath: string, convertedContent: string): void {
    this._cache.set(origFullPath, convertedContent)
  }
  clearSync (): void {
    this._cache.clear()
  }
}
