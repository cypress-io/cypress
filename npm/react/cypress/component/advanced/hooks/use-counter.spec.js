// @ts-check
/// <reference types="cypress" />
import React, { useState, useCallback } from 'react'
// @ts-ignore
import { mountHook } from 'cypress-react-unit-test'

// testing example hook function from
// https://dev.to/jooforja/12-recipes-for-testing-react-applications-using-testing-library-1bh2#hooks
function useCounter() {
  const [count, setCount] = useState(0)
  const increment = useCallback(() => setCount(x => x + 1), [])
  return { count, increment }
}

describe('useCounter hook', function() {
  it('increments the count', function() {
    mountHook(() => useCounter()).then(result => {
      expect(result.current.count).to.equal(0)
      result.current.increment()
      expect(result.current.count).to.equal(1)
      result.current.increment()
      expect(result.current.count).to.equal(2)
    })
  })
})
