import Fuse from 'fuse.js'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

/**
 * Supports all Fuse options, with modified key definitions
 */
export interface FuzzySearchConfig<T> extends Omit<Fuse.IFuseOptions<T>, 'keys'> {
  keys?: {
    [Key in keyof T]?: true | {
      weight: number
    }
  }
}

/**
 * Provides fuzzy matching search over the supplied items, using weighted keys
 * @param items The items to search
 * @param searchInput A search string, provided if the hook is driven by external state
 * @param config The configuration of how to perform searches, based on Fuse config options
 *
 * @see https://fusejs.io/api/options.html
 */
export const useFuzzySearch = <T>(items: T[], searchInput?: string, config?: FuzzySearchConfig<T>): {
  searchInput: string
  results: Fuse.FuseResult<T>[] | undefined
  orderedResults: T[]
  onSearch: (searchInput: string) => void
} => {
  const finalConfig = useMemo((): Fuse.IFuseOptions<T> | undefined => {
    if (!config?.keys) {
      return config as Fuse.IFuseOptions<T>
    }

    return {
      ...config,
      keys: Object.keys(config.keys).map((key) => {
        const keyEntry = config.keys?.[key as keyof T] as true | {
          weight: number
        } | undefined

        if (keyEntry === undefined) {
          throw new Error('Unreachable branch. keyEntry does not exist')
        }

        if (typeof keyEntry === 'boolean') {
          return key
        }

        return {
          ...keyEntry,
          name: key,
        }
      }),
    }
  }, [config])

  const [cachedFuse, setCachedFuse] = useState<Fuse<T> | undefined>(() => new Fuse(items, finalConfig))
  const [lastSearchInput, setLastSearchInput] = useState<string>('')

  const results = useMemo(() => lastSearchInput !== '' ? cachedFuse?.search(lastSearchInput) : undefined, [lastSearchInput, cachedFuse])
  const orderedResults = useMemo(() => results?.map((r) => r.item), [results])

  useLayoutEffect(() => setLastSearchInput(searchInput ?? ''), [searchInput])

  useEffect(() => setCachedFuse(new Fuse(items, finalConfig)), [items, finalConfig])

  return {
    searchInput: lastSearchInput,
    results,
    // If orderedResults is undefined, that means we didn't search (empty searchInput)
    orderedResults: orderedResults !== undefined ? orderedResults : items,
    onSearch: setLastSearchInput,
  }
}
