import * as React from 'react'
import fuzzysort from 'fuzzysort'

interface UseFuzzySort<Input, Result> {
  search: string
  items: Input[]
  transformResult: (spec: Input, indexes: number[]) => Result
}

export const useFuzzySort = <T, R>({ search, items, transformResult }: UseFuzzySort<T, R>) => {
  const [lastSearchInput, setLastSearchInput] = React.useState<string>(search)
  const [cachedFuzzySort, setCachedFuzzySort] = React.useState<R[]>([])
  const [searchPromise, setSearchPromise] = React.useState<Fuzzysort.CancelablePromise<Fuzzysort.KeyResults<T>>>()

  React.useLayoutEffect(() => {
    if (searchPromise) {
      searchPromise.cancel()
    }

    if (!lastSearchInput) {
      setCachedFuzzySort(items.map((spec) => transformResult(spec, [])))
    }

    const promise = fuzzysort.goAsync(lastSearchInput, items, { key: 'relative' })

    setSearchPromise(promise)
    promise.then((result) => setCachedFuzzySort(result.map((res) => transformResult(res.obj, res.indexes))))
  }, [lastSearchInput, items, searchPromise, transformResult])

  return {
    setSearch: setLastSearchInput,
    search: lastSearchInput,
    matches: cachedFuzzySort,
  }
}
