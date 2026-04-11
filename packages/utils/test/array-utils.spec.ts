import { describe, it, expect } from 'vitest'
import {
  sortBy,
  groupBy,
  uniqBy,
  difference,
  intersection,
  without,
  partition,
} from '../src/array-utils'

describe('sortBy', () => {
  it('sorts by function iteratee', () => {
    expect(sortBy([3, 1, 2], (x) => x)).toEqual([1, 2, 3])
  })

  it('sorts by string key', () => {
    const arr = [{ name: 'c' }, { name: 'a' }, { name: 'b' }]

    expect(sortBy(arr, 'name')).toEqual([
      { name: 'a' },
      { name: 'b' },
      { name: 'c' },
    ])
  })

  it('does not mutate original array', () => {
    const arr = [3, 1, 2]

    sortBy(arr, (x) => x)
    expect(arr).toEqual([3, 1, 2])
  })

  it('handles numeric values', () => {
    const arr = [{ age: 30 }, { age: 10 }, { age: 20 }]

    expect(sortBy(arr, 'age')).toEqual([
      { age: 10 },
      { age: 20 },
      { age: 30 },
    ])
  })
})

describe('groupBy', () => {
  it('groups by function', () => {
    expect(groupBy([1, 2, 3, 4], (x) => x % 2 === 0 ? 'even' : 'odd')).toEqual({
      odd: [1, 3],
      even: [2, 4],
    })
  })

  it('groups by string key', () => {
    const arr = [{ type: 'a', v: 1 }, { type: 'b', v: 2 }, { type: 'a', v: 3 }]

    expect(groupBy(arr, 'type')).toEqual({
      a: [{ type: 'a', v: 1 }, { type: 'a', v: 3 }],
      b: [{ type: 'b', v: 2 }],
    })
  })
})

describe('uniqBy', () => {
  it('deduplicates by function', () => {
    expect(uniqBy([1.1, 1.2, 2.1, 2.3], Math.floor)).toEqual([1.1, 2.1])
  })

  it('deduplicates by string key', () => {
    const arr = [{ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 1, n: 'c' }]

    expect(uniqBy(arr, 'id')).toEqual([{ id: 1, n: 'a' }, { id: 2, n: 'b' }])
  })
})

describe('difference', () => {
  it('returns elements not in exclusion arrays', () => {
    expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3])
  })

  it('handles multiple exclusion arrays', () => {
    expect(difference([1, 2, 3, 4, 5], [2], [4, 5])).toEqual([1, 3])
  })

  it('returns all if no exclusions match', () => {
    expect(difference([1, 2], [3])).toEqual([1, 2])
  })
})

describe('intersection', () => {
  it('returns common elements', () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3])
  })

  it('deduplicates result', () => {
    expect(intersection([1, 1, 2, 2], [1, 2])).toEqual([1, 2])
  })

  it('handles multiple arrays', () => {
    expect(intersection([1, 2, 3], [2, 3, 4], [3, 4, 5])).toEqual([3])
  })

  it('returns empty for no arrays', () => {
    expect(intersection()).toEqual([])
  })

  it('returns empty when no common elements', () => {
    expect(intersection([1, 2], [3, 4])).toEqual([])
  })
})

describe('without', () => {
  it('removes specified values', () => {
    expect(without([1, 2, 3, 4], 2, 4)).toEqual([1, 3])
  })

  it('returns copy if no values match', () => {
    expect(without([1, 2], 3)).toEqual([1, 2])
  })
})

describe('partition', () => {
  it('splits array by predicate', () => {
    expect(partition([1, 2, 3, 4], (x) => x % 2 === 0)).toEqual([[2, 4], [1, 3]])
  })

  it('handles all passing', () => {
    expect(partition([2, 4], (x) => x % 2 === 0)).toEqual([[2, 4], []])
  })

  it('handles none passing', () => {
    expect(partition([1, 3], (x) => x % 2 === 0)).toEqual([[], [1, 3]])
  })
})
