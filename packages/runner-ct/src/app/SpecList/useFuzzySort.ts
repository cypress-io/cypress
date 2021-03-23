import * as React from 'react'
import fuzzysort from 'fuzzysort'

interface UseFuzzySort<Input, Result> {
  search: string
  items: Input[]
  options: Fuzzysort.KeyOptions
  transformResult: (spec: Input, indexes: number[]) => Result
}

export const useFuzzySort = <T, R>({ search, items, transformResult, options }: UseFuzzySort<T, R>) => {
  const [lastSearchInput, setLastSearchInput] = React.useState<string>(search)
  const [cachedFuzzySort, setCachedFuzzySort] = React.useState<R[]>([])
  const [searchPromise, setSearchPromise] = React.useState<Fuzzysort.CancelablePromise<Fuzzysort.KeyResults<T>>>()

  React.useLayoutEffect(() => {
    // If no search was entered we just show all the items.
    if (!lastSearchInput) {
      return setCachedFuzzySort(items.map((spec) => transformResult(spec, [])))
    }

    const promise = fuzzysort.goAsync(lastSearchInput, items, options)

    setSearchPromise(promise)
    promise.then((result) => {
      return setCachedFuzzySort(result.map((res) => {
        return transformResult(res.obj, res.indexes)
      }))
    })
  // TODO: Figure out why passing transformResult as a dep causes infinite loop.
  // eslint:disable react-hooks/exhaustive-deps
  }, [lastSearchInput, items, setCachedFuzzySort])

  const setSearch = (search: string) => {
    if (searchPromise) {
      searchPromise.cancel()
    }

    setLastSearchInput(search)
  }

  return {
    setSearch,
    search: lastSearchInput,
    matches: cachedFuzzySort,
  }
}
