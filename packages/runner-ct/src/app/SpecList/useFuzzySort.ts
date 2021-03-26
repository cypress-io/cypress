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

  React.useEffect(() => {
    // If no search was entered we just show all the items.
    if (!lastSearchInput) {
      return setResults(items.map((spec) => transformResult(spec, [])))
    }

    const promise = fuzzysort.goAsync(lastSearchInput, items, options)

    promise.then((result) => {
      return setResults(result.map((res) => {
        return transformResult(res.obj, res.indexes)
      }))
    })

    return () => {
      promise.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSearchInput, items, setResults, transformResult])

  return {
    setSearch: setLastSearchInput,
    search: lastSearchInput,
    matches: results,
  }
}
