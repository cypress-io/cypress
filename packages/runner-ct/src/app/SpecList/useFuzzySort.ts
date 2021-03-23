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
  const [results, setResults] = React.useState<R[]>([])
  const searchPromise = React.useRef<Fuzzysort.CancelablePromise<Fuzzysort.KeyResults<T>>>()

  React.useEffect(() => {
    // If no search was entered we just show all the items.
    if (!lastSearchInput) {
      return setResults(items.map((spec) => transformResult(spec, [])))
    }

    const promise = fuzzysort.goAsync(lastSearchInput, items, options)

    searchPromise.current = promise
    promise.then((result) => {
      return setResults(result.map((res) => {
        return transformResult(res.obj, res.indexes)
      }))
    })

    return () => {
      searchPromise.current?.cancel()
    }
  }, [lastSearchInput, items, setResults, transformResult])

  return {
    setSearch: setLastSearchInput,
    search: lastSearchInput,
    matches: results,
  }
}
